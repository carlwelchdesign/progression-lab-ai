export const chordSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['inputSummary', 'nextChordSuggestions', 'progressionIdeas', 'structureSuggestions'],
  properties: {
    inputSummary: {
      type: 'object',
      additionalProperties: false,
      required: [
        'seedChords',
        'mood',
        'mode',
        'genre',
        'styleReference',
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
        styleReference: { type: ['string', 'null'] },
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
