export const curriculumJsonSchema = {
  name: 'generated_curriculum',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['musicianIntro', 'skillLevelAssessment', 'currentBatch', 'lessons'],
    properties: {
      musicianIntro: { type: 'string' },
      skillLevelAssessment: { type: 'string' },
      currentBatch: { type: 'integer', minimum: 1 },
      lessons: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'title', 'estimatedMinutes', 'batchNumber', 'skillLevel', 'steps'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            estimatedMinutes: { type: 'integer', minimum: 1 },
            batchNumber: { type: 'integer', minimum: 1 },
            skillLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            steps: {
              type: 'array',
              minItems: 1,
              items: {
                oneOf: [
                  {
                    type: 'object',
                    additionalProperties: false,
                    required: ['type', 'heading', 'body'],
                    properties: {
                      type: { type: 'string', const: 'text' },
                      heading: { type: 'string' },
                      body: { type: 'string' },
                      tip: { type: 'string' },
                    },
                  },
                  {
                    type: 'object',
                    additionalProperties: false,
                    required: ['type', 'exercise'],
                    properties: {
                      type: { type: 'string', const: 'exercise' },
                      exercise: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['id', 'prompt', 'chord', 'targetNotes'],
                        properties: {
                          id: { type: 'string' },
                          prompt: { type: 'string' },
                          chord: { type: 'string' },
                          hint: { type: 'string' },
                          targetNotes: {
                            type: 'array',
                            minItems: 1,
                            items: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
} as const;
