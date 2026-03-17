import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chordSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'inputSummary',
    'nextChordSuggestions',
    'progressionIdeas',
    'structureSuggestions',
  ],
  properties: {
    inputSummary: {
      type: 'object',
      additionalProperties: false,
      required: [
        'seedChords',
        'mood',
        'mode',
        'genre',
        'instrument',
        'adventurousness',
      ],
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

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY' },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: 'OpenAI returned empty output' },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error('Failed to parse output_text:', raw);
      console.error(parseError);
      return NextResponse.json(
        { error: 'Model returned invalid JSON', raw },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('chord-suggestions route error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate chord suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}