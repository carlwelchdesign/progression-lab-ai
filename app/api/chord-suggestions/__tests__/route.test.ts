/** @jest-environment node */

var mockCreate = jest.fn();
var mockCreateRateLimitResponse = jest.fn();
var mockGetSessionFromRequest = jest.fn();
var mockGetAccessContextForSession = jest.fn();
var mockGetCurrentMonthUsageCount = jest.fn();
var mockRecordUsageEvent = jest.fn();
var mockGetRenderedPrompt = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    responses: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  }));
});

jest.mock('../../../../lib/rateLimiting', () => ({
  createRateLimitResponse: (...args: unknown[]) => mockCreateRateLimitResponse(...args),
}));

jest.mock('../../../../lib/auth', () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSessionFromRequest(...args),
}));

jest.mock('../../../../lib/entitlements', () => ({
  getAccessContextForSession: (...args: unknown[]) => mockGetAccessContextForSession(...args),
  hasReachedLimit: (limit: number | null, used: number) => limit !== null && used >= limit,
}));

jest.mock('../../../../lib/usage', () => ({
  getCurrentMonthUsageCount: (...args: unknown[]) => mockGetCurrentMonthUsageCount(...args),
  recordUsageEvent: (...args: unknown[]) => mockRecordUsageEvent(...args),
}));

jest.mock('../../../../lib/promptVersionConfig', () => ({
  getRenderedPrompt: (...args: unknown[]) => mockGetRenderedPrompt(...args),
}));

import { POST } from '../route';

const validModelPayload = {
  inputSummary: {
    seedChords: ['Fmaj7', 'F#m7'],
    mood: 'dreamy',
    mode: 'lydian',
    genre: 'piano house',
    styleReference: null,
    instrument: 'both',
    adventurousness: 'balanced',
    language: 'en',
  },
  nextChordSuggestions: [
    {
      chord: 'G7',
      romanNumeral: 'II7',
      functionExplanation: 'Secondary dominant that points to C.',
      tensionLevel: 3,
      confidence: 4,
      voicingHint: 'Use a tight top voice.',
      pianoVoicing: {
        leftHand: ['G2', 'D3'],
        rightHand: ['F3', 'B3', 'D4'],
      },
      guitarVoicing: {
        title: 'G7',
        position: 1,
        fingers: [
          { string: 6, fret: 3, finger: '2' },
          { string: 5, fret: 2, finger: '1' },
          { string: 1, fret: 1, finger: '1' },
        ],
        barres: [],
      },
    },
  ],
  progressionIdeas: [
    {
      label: 'Lifted loop',
      chords: ['Fmaj7', 'G7', 'Am7', 'Cmaj7'],
      feel: 'Airy movement',
      performanceTip: 'Slightly delay the last chord.',
      pianoVoicings: [],
    },
  ],
  structureSuggestions: [
    {
      section: 'verse',
      bars: 8,
      harmonicIdea: 'Keep bass sparse in the first 4 bars.',
    },
  ],
};

describe('POST /api/chord-suggestions', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalConsoleError = console.error;

  beforeEach(() => {
    mockCreate.mockReset();
    mockCreateRateLimitResponse.mockReset();
    mockGetSessionFromRequest.mockReset();
    mockGetAccessContextForSession.mockReset();
    mockGetCurrentMonthUsageCount.mockReset();
    mockRecordUsageEvent.mockReset();
    mockCreateRateLimitResponse.mockReturnValue(null);
    mockGetSessionFromRequest.mockReturnValue({ userId: 'user-1', role: 'USER' });
    mockGetAccessContextForSession.mockResolvedValue({
      userId: 'user-1',
      role: 'USER',
      plan: 'SESSION',
      entitlements: {
        gptModel: 'gpt-5.4',
        aiGenerationsPerMonth: 10,
        maxSavedProgressions: 10,
        maxSavedArrangements: 5,
        maxPublicShares: 2,
        canExportMidi: false,
        canExportPdf: false,
        canSharePublicly: true,
        canUsePremiumAiModel: false,
      },
    });
    mockGetCurrentMonthUsageCount.mockResolvedValue(0);
    mockRecordUsageEvent.mockResolvedValue({ id: 'usage-1' });
    mockGetRenderedPrompt.mockImplementation(({ outputLanguage }: { outputLanguage: string }) =>
      Promise.resolve({
        text: `Write all explanatory prose fields in ${outputLanguage}.`,
        versionNumber: 7,
        source: 'db',
      }),
    );
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;

    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('returns 500 when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    const response = await POST({ text: async () => '{}' } as never);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: 'Chord suggestions are unavailable' });
  });

  it('returns 401 when the user is not authenticated', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockGetSessionFromRequest.mockReturnValue(null);

    const response = await POST({ text: async () => '{}' } as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Authentication required to generate chord suggestions' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 402 when the plan quota is exhausted', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockGetCurrentMonthUsageCount.mockResolvedValue(10);

    const response = await POST({ text: async () => '{}' } as never);
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body).toEqual({
      error: 'You have reached your monthly AI generation limit for this plan',
      code: 'AI_GENERATION_LIMIT_REACHED',
      plan: 'SESSION',
      limit: 10,
      used: 10,
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns parsed model response when OpenAI responds with valid JSON', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify(validModelPayload),
    });

    const response = await POST({
      text: async () =>
        JSON.stringify({
          seedChords: ['Fmaj7', 'F#m7'],
          mood: 'dreamy',
          mode: 'lydian',
          genre: 'piano house',
          styleReference: 'Barry Harris',
          instrument: 'both',
          adventurousness: 'balanced',
          language: 'es',
        }),
    } as never);

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(validModelPayload);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockRecordUsageEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      eventType: 'AI_GENERATION',
      metadata: {
        model: 'gpt-5.4',
        promptKey: 'chord_suggestions',
        promptVersion: 7,
        promptSource: 'db',
      },
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining('Write all explanatory prose fields in Spanish.'),
        input: expect.any(String),
        text: expect.objectContaining({
          format: expect.objectContaining({
            schema: expect.objectContaining({
              properties: expect.objectContaining({
                nextChordSuggestions: expect.objectContaining({
                  minItems: 4,
                  maxItems: 4,
                }),
                progressionIdeas: expect.objectContaining({
                  minItems: 3,
                  maxItems: 3,
                }),
                structureSuggestions: expect.objectContaining({
                  minItems: 3,
                  maxItems: 3,
                }),
              }),
            }),
          }),
        }),
      }),
    );

    const openAiRequest = mockCreate.mock.calls[0][0] as { input: string };
    expect(JSON.parse(openAiRequest.input)).toEqual(
      expect.objectContaining({
        language: 'es',
      }),
    );
  });

  it('falls back to English when the requested locale is unsupported', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify(validModelPayload),
    });

    const response = await POST({
      text: async () =>
        JSON.stringify({
          seedChords: ['Fmaj7'],
          mood: 'dreamy',
          mode: 'lydian',
          genre: 'piano house',
          styleReference: null,
          instrument: 'both',
          adventurousness: 'balanced',
          language: 'xx-invalid',
        }),
    } as never);

    expect(response.status).toBe(200);

    const openAiRequest = mockCreate.mock.calls[0][0] as {
      input: string;
      instructions: string;
    };

    expect(JSON.parse(openAiRequest.input)).toEqual(
      expect.objectContaining({
        language: 'en',
      }),
    );
    expect(openAiRequest.instructions).toContain('Write all explanatory prose fields in English.');
  });

  it('returns 502 when the model returns invalid JSON', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockResolvedValue({
      output_text: '{invalid json',
    });

    const response = await POST({ text: async () => '{}' } as never);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe('Failed to generate chord suggestions');
  });

  it('pulls add9 color tones closer to the root in piano voicings', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        ...validModelPayload,
        nextChordSuggestions: [
          {
            ...validModelPayload.nextChordSuggestions[0],
            chord: 'Fadd9',
            pianoVoicing: {
              leftHand: ['F2', 'C3'],
              rightHand: ['A3', 'C4', 'F4', 'G5'],
            },
          },
        ],
        progressionIdeas: [
          {
            label: 'Silky pocket',
            chords: ['Fadd9'],
            feel: 'Warm pop R&B',
            performanceTip: 'Lay back behind the beat.',
            pianoVoicings: [
              {
                leftHand: ['F2', 'C3'],
                rightHand: ['A3', 'C4', 'F4', 'G5'],
              },
            ],
          },
        ],
      }),
    });

    const response = await POST({
      text: async () =>
        JSON.stringify({
          seedChords: ['Fmaj7'],
          mood: 'smooth',
          mode: 'ionian',
          genre: 'pop r&b',
          styleReference: null,
          instrument: 'both',
          adventurousness: 'balanced',
        }),
    } as never);

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.nextChordSuggestions[0].pianoVoicing.rightHand).toEqual(['A3', 'C4', 'F4', 'G4']);
    expect(body.progressionIdeas[0].pianoVoicings[0].rightHand).toEqual(['A3', 'C4', 'F4', 'G4']);
  });

  it('pulls sus2 color tones closer to the root in piano voicings', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        ...validModelPayload,
        nextChordSuggestions: [
          {
            ...validModelPayload.nextChordSuggestions[0],
            chord: 'Gsus2',
            pianoVoicing: {
              leftHand: ['G2', 'D3'],
              rightHand: ['A5', 'D4', 'G4'],
            },
          },
        ],
        progressionIdeas: [
          {
            label: 'Open shimmer',
            chords: ['Gsus2'],
            feel: 'Bright pop',
            performanceTip: 'Keep it light and even.',
            pianoVoicings: [
              {
                leftHand: ['G2', 'D3'],
                rightHand: ['A5', 'D4', 'G4'],
              },
            ],
          },
        ],
      }),
    });

    const response = await POST({
      text: async () =>
        JSON.stringify({
          seedChords: ['Cmaj7'],
          mood: 'uplifting',
          mode: 'ionian',
          genre: 'pop',
          styleReference: null,
          instrument: 'both',
          adventurousness: 'balanced',
        }),
    } as never);

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.nextChordSuggestions[0].pianoVoicing.rightHand).toEqual(['D4', 'G4', 'A4']);
    expect(body.progressionIdeas[0].pianoVoicings[0].rightHand).toEqual(['D4', 'G4', 'A4']);
  });

  it('returns 400 when the request body is invalid JSON', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const response = await POST({ text: async () => '{bad json' } as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Request body must be valid JSON' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 413 when the request body is too large', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const response = await POST({ text: async () => 'x'.repeat(9000) } as never);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ error: 'Request body is too large' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('uses fallback prompt metadata when prompt service returns fallback source', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockGetRenderedPrompt.mockResolvedValue({
      text: 'Write all explanatory prose fields in English.',
      versionNumber: null,
      source: 'fallback',
    });
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify(validModelPayload),
    });

    const response = await POST({
      text: async () =>
        JSON.stringify({
          seedChords: ['Fmaj7'],
          mood: 'calm',
          mode: 'ionian',
          genre: 'pop',
          styleReference: null,
          instrument: 'both',
          adventurousness: 'safe',
          language: 'en',
        }),
    } as never);

    expect(response.status).toBe(200);
    expect(mockRecordUsageEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      eventType: 'AI_GENERATION',
      metadata: {
        model: 'gpt-5.4',
        promptKey: 'chord_suggestions',
        promptVersion: null,
        promptSource: 'fallback',
      },
    });
  });
});
