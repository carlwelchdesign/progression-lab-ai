import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

import type { ChordSuggestionResponse, PianoVoicing } from '../../../lib/types';
import { NOTE_TO_SEMITONE } from '../../../lib/noteToSemitone';
import { chordSuggestionInstructions } from './instructions';
import { chordSuggestionSchema } from './schema';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHORD_ROOT_PATTERN = /^([A-G](?:#|b)?)/;
const NOTE_PATTERN = /^([A-G](?:#|b)?)(-?\d+)$/;

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

/**
 * Generates chord suggestions, progression ideas, and structure ideas via OpenAI.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const body = await req.json();

    const input = JSON.stringify({
      seedChords: body.seedChords ?? [],
      mood: body.mood ?? '',
      mode: body.mode ?? '',
      genre: body.genre ?? '',
      styleReference:
        typeof body.styleReference === 'string' && body.styleReference.trim().length > 0
          ? body.styleReference.trim()
          : null,
      instrument: body.instrument ?? 'both',
      adventurousness: body.adventurousness ?? 'balanced',
    });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.4',
      instructions: chordSuggestionInstructions,
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

    const raw = response.output_text;

    if (!raw) {
      console.error('Empty output_text from OpenAI response:', response);
      return NextResponse.json({ error: 'OpenAI returned empty output' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = normalizeChordSuggestionResponse(JSON.parse(raw) as ChordSuggestionResponse);
    } catch (parseError) {
      console.error('Failed to parse output_text:', raw);
      console.error(parseError);
      return NextResponse.json({ error: 'Model returned invalid JSON', raw }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('chord-suggestions route error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate chord suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
