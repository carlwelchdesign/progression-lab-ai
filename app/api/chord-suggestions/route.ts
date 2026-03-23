import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

import type { ChordSuggestionResponse, PianoVoicing } from '../../../lib/types';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHORD_ROOT_PATTERN = /^([A-G](?:#|b)?)/;
const NOTE_PATTERN = /^([A-G](?:#|b)?)(-?\d+)$/;
const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'E#': 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

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

const chordSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['inputSummary', 'nextChordSuggestions', 'progressionIdeas', 'structureSuggestions'],
  properties: {
    inputSummary: {
      type: 'object',
      additionalProperties: false,
      required: ['seedChords', 'mood', 'mode', 'genre', 'instrument', 'adventurousness'],
      properties: {
        seedChords: {
          type: 'array',
          items: { type: 'string' },
        },
        mood: { type: ['string', 'null'] },
        mode: { type: ['string', 'null'] },
        genre: { type: ['string', 'null'] },
        instrument: {
          type: ['string', 'null'],
          enum: ['guitar', 'piano', 'both', null],
        },
        adventurousness: {
          type: ['string', 'null'],
          enum: ['safe', 'balanced', 'surprising', null],
        },
      },
    },
    nextChordSuggestions: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'chord',
          'romanNumeral',
          'functionExplanation',
          'tensionLevel',
          'confidence',
          'voicingHint',
          'pianoVoicing',
          'guitarVoicing',
        ],
        properties: {
          chord: { type: 'string' },
          romanNumeral: { type: ['string', 'null'] },
          functionExplanation: { type: 'string' },
          tensionLevel: { type: 'integer', minimum: 1, maximum: 5 },
          confidence: { type: 'integer', minimum: 1, maximum: 5 },
          voicingHint: { type: ['string', 'null'] },
          pianoVoicing: {
            type: ['object', 'null'],
            additionalProperties: false,
            required: ['leftHand', 'rightHand'],
            properties: {
              leftHand: {
                type: 'array',
                items: { type: 'string' },
              },
              rightHand: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          guitarVoicing: {
            type: ['object', 'null'],
            additionalProperties: false,
            required: ['title', 'position', 'fingers', 'barres'],
            properties: {
              title: { type: 'string' },
              position: { type: ['integer', 'null'] },
              fingers: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['string', 'fret', 'finger'],
                  properties: {
                    string: { type: 'integer', minimum: 1, maximum: 6 },
                    fret: {
                      anyOf: [
                        { type: 'integer', minimum: 0, maximum: 24 },
                        { type: 'string', enum: ['x'] },
                      ],
                    },
                    finger: { type: ['string', 'null'] },
                  },
                },
              },
              barres: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['fromString', 'toString', 'fret', 'text'],
                  properties: {
                    fromString: { type: 'integer', minimum: 1, maximum: 6 },
                    toString: { type: 'integer', minimum: 1, maximum: 6 },
                    fret: { type: 'integer', minimum: 1, maximum: 24 },
                    text: { type: ['string', 'null'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    progressionIdeas: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'chords', 'feel', 'performanceTip', 'pianoVoicings'],
        properties: {
          label: { type: 'string' },
          chords: {
            type: 'array',
            items: { type: 'string' },
          },
          feel: { type: 'string' },
          performanceTip: { type: ['string', 'null'] },
          pianoVoicings: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['leftHand', 'rightHand'],
              properties: {
                leftHand: {
                  type: 'array',
                  items: { type: 'string' },
                },
                rightHand: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    structureSuggestions: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['section', 'bars', 'harmonicIdea'],
        properties: {
          section: {
            type: 'string',
            enum: ['verse', 'pre-chorus', 'chorus', 'bridge', 'outro'],
          },
          bars: { type: 'integer', minimum: 1, maximum: 32 },
          harmonicIdea: { type: 'string' },
        },
      },
    },
  },
} as const;

/**
 * Generates chord suggestions, progression ideas, and structure ideas via OpenAI.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const body = await req.json();

    const instructions = `
You are a songwriting and harmony assistant.

Return:
- 4 next chord suggestions
- 3 progression ideas
- 3 structure suggestions

Rules:
- Be musically plausible.
- Favor practical ideas for real musicians.
- Respect the requested mode and mood.
- You may use tasteful modal borrowing.
- Prefer readable chord names like Fmaj7, Am7, Cmaj7, G7sus4.
- Return only JSON matching the schema.

For each next chord suggestion, return a pianoVoicing object with:
- leftHand: an array of note names in scientific pitch notation
- rightHand: an array of note names in scientific pitch notation

Rules:
- Always include octave numbers, e.g. C3, E4, G#4
- Do not return note names without octaves
- leftHand should usually contain 1 to 2 notes in a lower register
- rightHand should usually contain 3 to 5 notes in a playable upper register
- Make the voicings musical and practical for piano house / modern chord playing
- Prefer spread, playable voicings rather than dense clusters
- For add2/add9/sus2 chords, especially in pop and R&B, prefer the 2/9 as a close color tone near the root in the right hand, not isolated more than an octave above the rest of the voicing

Example:
"pianoVoicing": {
  "leftHand": ["F2", "C3"],
  "rightHand": ["A3", "E4", "G4", "C5"]
}

For each nextChordSuggestion, also return a guitarVoicing object for a playable 6-string standard tuning voicing.

Rules:
- string is 1 through 6.
- fret is either an integer or "x" for muted.
- finger is "1", "2", "3", "4", or null.
- include barres when needed.
- if no practical voicing is available, return null.

For each progression idea, also return pianoVoicings.

Rules:
- pianoVoicings must have the same number of entries as chords
- each voicing must correspond to the chord at the same index
- each voicing must use scientific pitch notation with octave numbers
- each voicing must include:
  - leftHand: 1 to 2 notes in a lower register
  - rightHand: 3 to 5 notes in a practical upper register
- favor smooth voice leading across the progression
- make the voicings playable and stylistically appropriate for the requested genre and mood
- for add2/add9/sus2 chords, keep the 2/9 close to the root in the right hand when that serves a pop or R&B feel

When returning progressionIdeas, ensure pianoVoicings.length exactly matches chords.length.
    `.trim();

    const input = JSON.stringify({
      seedChords: body.seedChords ?? [],
      mood: body.mood ?? '',
      mode: body.mode ?? '',
      genre: body.genre ?? '',
      instrument: body.instrument ?? 'both',
      adventurousness: body.adventurousness ?? 'balanced',
    });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.4',
      instructions,
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
