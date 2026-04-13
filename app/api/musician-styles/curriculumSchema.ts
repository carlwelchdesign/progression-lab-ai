/**
 * Strict JSON schema for the OpenAI Responses API.
 * Must match GeneratedCurriculumData in features/musician-styles/types.ts.
 */
export const curriculumSchema = {
  type: 'object',
  properties: {
    musicianIntro: { type: 'string' },
    skillLevelAssessment: { type: 'string' },
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          estimatedMinutes: { type: 'number' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['text', 'exercise'] },
                heading: { type: ['string', 'null'] },
                body: { type: ['string', 'null'] },
                tip: { type: ['string', 'null'] },
                exercise: {
                  anyOf: [
                    {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        prompt: { type: 'string' },
                        chord: { type: 'string' },
                        hint: { type: ['string', 'null'] },
                        targetNotes: { type: ['array', 'null'], items: { type: 'string' } },
                      },
                      required: ['id', 'prompt', 'chord', 'hint', 'targetNotes'],
                      additionalProperties: false,
                    },
                    { type: 'null' },
                  ],
                },
              },
              required: ['type', 'heading', 'body', 'tip', 'exercise'],
              additionalProperties: false,
            },
          },
        },
        required: ['id', 'title', 'estimatedMinutes', 'steps'],
        additionalProperties: false,
      },
    },
  },
  required: ['musicianIntro', 'skillLevelAssessment', 'lessons'],
  additionalProperties: false,
} as const;
