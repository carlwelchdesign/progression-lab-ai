import { UsageEventType } from '@prisma/client';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

import { getSessionFromRequest } from '../../../lib/auth';
import { getAccessContextForSession, hasReachedLimit } from '../../../lib/entitlements';
import { getLocaleDefinition, normalizeAppLocale } from '../../../lib/i18n/locales';
import { createRateLimitResponse } from '../../../lib/rateLimiting';
import { createPlanLimitResponse } from '../../../lib/subscriptionResponses';
import type { ChordSuggestionResponse, PianoVoicing } from '../../../lib/types';
import { getCurrentMonthUsageCount, recordUsageEvent } from '../../../lib/usage';
import { NOTE_TO_SEMITONE } from '../../../lib/noteToSemitone';
import { getRenderedPrompt } from '../../../lib/promptVersionConfig';
import { CHORD_SUGGESTION_PROMPT_KEY } from './instructions';
import { chordSuggestionSchema } from './schema';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHORD_ROOT_PATTERN = /^([A-G](?:#|b)?)/;
const NOTE_PATTERN = /^([A-G](?:#|b)?)(-?\d+)$/;
const MAX_REQUEST_BODY_BYTES = 8 * 1024;
const MAX_SEED_CHORDS = 8;
const MAX_TEXT_FIELD_LENGTH = 200;
const MAX_CUSTOM_VOICING_INSTRUCTIONS_LENGTH = 500;
const ALLOWED_VOICING_PROFILES = new Set(['close', 'spread', 'rootless', 'drop2', 'openAdd9']);
const CHORD_SUGGESTION_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

const MODEL_FALLBACKS: Record<string, string> = {
  'gpt-3.5-turbo': 'gpt-4o-mini',
  'gpt-3.5-turbo-0125': 'gpt-4o-mini',
};

type ChordSuggestionRequestBody = {
  seedChords?: unknown;
  mood?: unknown;
  mode?: unknown;
  genre?: unknown;
  styleReference?: unknown;
  voicingProfiles?: unknown;
  customVoicingInstructions?: unknown;
  instrument?: unknown;
  adventurousness?: unknown;
  language?: unknown;
};

type ChordSuggestionModelInput = {
  seedChords: string[];
  mood: string;
  mode: string;
  genre: string;
  styleReference: string | null;
  voicingProfiles: Array<'close' | 'spread' | 'rootless' | 'drop2' | 'openAdd9'>;
  customVoicingInstructions: string | null;
  instrument: 'guitar' | 'piano' | 'both';
  adventurousness: 'safe' | 'balanced' | 'surprising';
  language: string;
};

function resolveModelForResponsesApi(model: string): string {
  return MODEL_FALLBACKS[model] ?? model;
}

function isOpenAiApiError(
  error: unknown,
): error is { status?: number; message?: string; code?: string; type?: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

/**
 * Returns chord-root pitch class from a chord symbol, or null when unknown.
 */
function getChordRootPitchClass(chordName: string): number | null {
  const match = chordName.match(CHORD_ROOT_PATTERN);
  if (!match) {
    return null;
  }

  return NOTE_TO_SEMITONE[match[1]] ?? null;
}

/**
 * Parses scientific-pitch note text (e.g., Eb4) into MIDI note number.
 */
function parseMidi(note: string): number | null {
  const match = note.match(NOTE_PATTERN);
  if (!match) {
    return null;
  }

  const semitone = NOTE_TO_SEMITONE[match[1]];
  const octave = Number.parseInt(match[2], 10);

  if (semitone === undefined || Number.isNaN(octave)) {
    return null;
  }

  return (octave + 1) * 12 + semitone;
}

/**
 * Returns pitch class [0..11] for a note name.
 */
function getPitchClass(note: string): number | null {
  const midi = parseMidi(note);
  if (midi === null) {
    return null;
  }

  return ((midi % 12) + 12) % 12;
}

/**
 * Shifts a note string by whole octaves while preserving spelling.
 */
function shiftNoteByOctaves(note: string, octaveDelta: number): string {
  const match = note.match(NOTE_PATTERN);
  if (!match) {
    return note;
  }

  return `${match[1]}${Number.parseInt(match[2], 10) + octaveDelta}`;
}

/**
 * Sorts notes in ascending pitch order.
 */
function sortNotesByPitch(notes: string[]): string[] {
  return [...notes].sort((left, right) => {
    const leftMidi = parseMidi(left);
    const rightMidi = parseMidi(right);

    if (leftMidi === null || rightMidi === null) {
      return left.localeCompare(right);
    }

    return leftMidi - rightMidi;
  });
}

/**
 * Normalizes add2/add9/sus2 voicings to keep the color tone close to the chord body.
 */
function normalizeAddToneVoicing(chordName: string, voicing: PianoVoicing): PianoVoicing {
  if (!/(?:add(?:2|9)|sus2)/i.test(chordName) || voicing.rightHand.length === 0) {
    return voicing;
  }

  const rootPitchClass = getChordRootPitchClass(chordName);
  if (rootPitchClass === null) {
    return voicing;
  }

  const addedTonePitchClass = (rootPitchClass + 2) % 12;
  const rightHandNotes = voicing.rightHand.map((note, index) => ({
    index,
    note,
    midi: parseMidi(note),
    pitchClass: getPitchClass(note),
  }));

  const addToneCandidates = rightHandNotes
    .filter((entry) => entry.midi !== null && entry.pitchClass === addedTonePitchClass)
    .sort((left, right) => (right.midi ?? -Infinity) - (left.midi ?? -Infinity));

  if (addToneCandidates.length === 0) {
    return voicing;
  }

  const highestAddTone = addToneCandidates[0];
  const anchor =
    rightHandNotes
      .filter(
        (entry) =>
          entry.midi !== null &&
          (entry.midi ?? -Infinity) < (highestAddTone.midi ?? Infinity) &&
          entry.pitchClass === rootPitchClass,
      )
      .sort((left, right) => (right.midi ?? -Infinity) - (left.midi ?? -Infinity))[0] ??
    rightHandNotes
      .filter(
        (entry) =>
          entry.midi !== null &&
          (entry.midi ?? -Infinity) < (highestAddTone.midi ?? Infinity) &&
          entry.pitchClass !== addedTonePitchClass,
      )
      .sort((left, right) => (right.midi ?? -Infinity) - (left.midi ?? -Infinity))[0];

  if (!anchor?.midi || !highestAddTone.midi) {
    return voicing;
  }

  let normalizedMidi = highestAddTone.midi;
  while (normalizedMidi - anchor.midi > 12) {
    normalizedMidi -= 12;
  }

  if (normalizedMidi === highestAddTone.midi) {
    return voicing;
  }

  const updatedRightHand = [...voicing.rightHand];
  updatedRightHand[highestAddTone.index] = shiftNoteByOctaves(
    highestAddTone.note,
    (normalizedMidi - highestAddTone.midi) / 12,
  );

  return {
    ...voicing,
    rightHand: sortNotesByPitch(updatedRightHand),
  };
}

/**
 * Applies voicing normalization to all payload voicings returned by the model.
 */
function normalizeChordSuggestionResponse(
  payload: ChordSuggestionResponse,
): ChordSuggestionResponse {
  return {
    ...payload,
    nextChordSuggestions: (payload.nextChordSuggestions ?? []).map((suggestion) => ({
      ...suggestion,
      pianoVoicing: suggestion.pianoVoicing
        ? normalizeAddToneVoicing(suggestion.chord, suggestion.pianoVoicing)
        : null,
    })),
    progressionIdeas: (payload.progressionIdeas ?? []).map((idea) => ({
      ...idea,
      pianoVoicings: (idea.pianoVoicings ?? []).map((voicing, index) =>
        normalizeAddToneVoicing(idea.chords[index] ?? '', voicing),
      ),
    })),
  };
}

function normalizeTextField(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  const normalized = value.trim();
  if (normalized.length > MAX_TEXT_FIELD_LENGTH) {
    throw new Error(`${fieldName} is too long`);
  }

  return normalized;
}

function normalizeTruncatedTextField(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function normalizeVoicingProfiles(
  value: unknown,
): Array<'close' | 'spread' | 'rootless' | 'drop2' | 'openAdd9'> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item): item is 'close' | 'spread' | 'rootless' | 'drop2' | 'openAdd9' =>
      ALLOWED_VOICING_PROFILES.has(item),
    );
}

function parseRequestBody(rawBody: string): ChordSuggestionRequestBody {
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_BODY_BYTES) {
    throw new Error('Request body is too large');
  }

  try {
    return JSON.parse(rawBody) as ChordSuggestionRequestBody;
  } catch {
    throw new Error('Request body must be valid JSON');
  }
}

function buildModelInput(body: ChordSuggestionRequestBody): ChordSuggestionModelInput {
  const seedChords = Array.isArray(body.seedChords)
    ? body.seedChords.filter((value): value is string => typeof value === 'string')
    : [];

  if (seedChords.length > MAX_SEED_CHORDS) {
    throw new Error('Too many seed chords');
  }

  const normalizedSeedChords = seedChords
    .map((chord) => chord.trim())
    .filter((chord) => chord.length > 0)
    .slice(0, MAX_SEED_CHORDS);

  return {
    seedChords: normalizedSeedChords,
    mood: normalizeTextField(body.mood ?? '', 'Mood'),
    mode: normalizeTextField(body.mode ?? '', 'Mode'),
    genre: normalizeTextField(body.genre ?? '', 'Genre'),
    styleReference:
      typeof body.styleReference === 'string' && body.styleReference.trim().length > 0
        ? normalizeTextField(body.styleReference, 'Style reference')
        : null,
    voicingProfiles: normalizeVoicingProfiles(body.voicingProfiles),
    customVoicingInstructions: (() => {
      const normalized = normalizeTruncatedTextField(
        body.customVoicingInstructions,
        MAX_CUSTOM_VOICING_INSTRUCTIONS_LENGTH,
      );

      return normalized.length > 0 ? normalized : null;
    })(),
    instrument:
      body.instrument === 'piano' || body.instrument === 'guitar' || body.instrument === 'both'
        ? body.instrument
        : 'both',
    adventurousness:
      body.adventurousness === 'safe' ||
      body.adventurousness === 'balanced' ||
      body.adventurousness === 'surprising'
        ? body.adventurousness
        : 'balanced',
    language: normalizeAppLocale(body.language),
  };
}

/**
 * Generates chord suggestions, progression ideas, and structure ideas via OpenAI.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = createRateLimitResponse(req, CHORD_SUGGESTION_RATE_LIMIT);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required to generate chord suggestions' },
        { status: 401 },
      );
    }

    const accessContext = await getAccessContextForSession(session);
    if (!accessContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Chord suggestions are unavailable' }, { status: 503 });
    }

    const aiGenerationsUsed = await getCurrentMonthUsageCount(
      session.userId,
      UsageEventType.AI_GENERATION,
    );
    if (hasReachedLimit(accessContext.entitlements.aiGenerationsPerMonth, aiGenerationsUsed)) {
      return createPlanLimitResponse({
        code: 'AI_GENERATION_LIMIT_REACHED',
        message: 'You have reached your monthly AI generation limit for this plan',
        plan: accessContext.plan,
        limit: accessContext.entitlements.aiGenerationsPerMonth,
        used: aiGenerationsUsed,
      });
    }

    const rawBody = await req.text();
    const body = parseRequestBody(rawBody);
    const modelInput = buildModelInput(body);
    const input = JSON.stringify(modelInput);
    const localeDefinition = getLocaleDefinition(modelInput.language);
    const requestedModel = accessContext.entitlements.gptModel;
    const model = resolveModelForResponsesApi(requestedModel);
    const prompt = await getRenderedPrompt({
      promptKey: CHORD_SUGGESTION_PROMPT_KEY,
      outputLanguage: localeDefinition.modelLanguage,
    });

    const response = await client.responses.create({
      model,
      instructions: prompt.text,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'chord_suggestion_response',
          strict: true,
          schema: chordSuggestionSchema,
        },
      },
    });

    await recordUsageEvent({
      userId: session.userId,
      eventType: UsageEventType.AI_GENERATION,
      metadata: {
        model,
        requestedModel,
        promptKey: CHORD_SUGGESTION_PROMPT_KEY,
        promptVersion: prompt.versionNumber,
        promptSource: prompt.source,
      },
    });

    const raw = response.output_text;

    if (!raw) {
      console.error('Empty output_text from OpenAI response:', response);
      return NextResponse.json({ error: 'Failed to generate chord suggestions' }, { status: 502 });
    }

    let parsed;
    try {
      parsed = normalizeChordSuggestionResponse(JSON.parse(raw) as ChordSuggestionResponse);
    } catch (parseError) {
      console.error(parseError);
      return NextResponse.json({ error: 'Failed to generate chord suggestions' }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('chord-suggestions route error:', error);

    if (isOpenAiApiError(error) && typeof error.status === 'number') {
      return NextResponse.json(
        {
          error: 'AI provider request failed',
          providerStatus: error.status,
        },
        { status: 502 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Request body is too large') {
        return NextResponse.json({ error: error.message }, { status: 413 });
      }

      if (
        error.message === 'Request body must be valid JSON' ||
        error.message.endsWith('must be a string') ||
        error.message.endsWith('is too long') ||
        error.message === 'Too many seed chords'
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Failed to generate chord suggestions' }, { status: 500 });
  }
}
