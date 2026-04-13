import OpenAI from 'openai';

type GeneratedProfileInput = {
  name: string;
  genre?: string;
};

type GeneratedProfile = {
  slug: string;
  displayName: string;
  aliases: string[];
  genre: string;
  era: string;
  tagline: string;
  styleDescription: string;
  signatureTechniques: string[];
  exampleSongs: string[];
  preferredKeys: string[];
  promptTemplate: string;
};

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

export function slugifyMusicianName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildFallbackProfile(input: GeneratedProfileInput): GeneratedProfile {
  const slug = slugifyMusicianName(input.name);
  const genre = input.genre?.trim() || 'Piano';

  return {
    slug,
    displayName: input.name.trim(),
    aliases: [input.name.trim()],
    genre,
    era: 'Unknown era',
    tagline: `Learn core ${genre} piano language inspired by ${input.name.trim()}.`,
    styleDescription: `A focused curriculum in the style of ${input.name.trim()} with practical MIDI exercises.`,
    signatureTechniques: ['Chord voicings', 'Rhythmic comping', 'Voice leading'],
    exampleSongs: [`Signature style of ${input.name.trim()}`],
    preferredKeys: ['C', 'G', 'F'],
    promptTemplate: `Teach piano in the style of ${input.name.trim()} with strict JSON output and MIDI target notes.`,
  };
}

export async function generateMusicianProfile(
  input: GeneratedProfileInput,
): Promise<GeneratedProfile> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error('INSUFFICIENT_INFORMATION');
  }

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackProfile(input);
  }

  try {
    const response = await getClient().responses.create({
      model: 'gpt-4o-mini',
      input: JSON.stringify({ name: trimmedName, genreHint: input.genre ?? null }),
      instructions:
        'Return a JSON object describing the pianist profile with keys: slug, displayName, aliases, genre, era, tagline, styleDescription, signatureTechniques, exampleSongs, preferredKeys, promptTemplate.',
      text: {
        format: {
          type: 'json_schema',
          name: 'musician_profile',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'slug',
              'displayName',
              'aliases',
              'genre',
              'era',
              'tagline',
              'styleDescription',
              'signatureTechniques',
              'exampleSongs',
              'preferredKeys',
              'promptTemplate',
            ],
            properties: {
              slug: { type: 'string' },
              displayName: { type: 'string' },
              aliases: { type: 'array', items: { type: 'string' } },
              genre: { type: 'string' },
              era: { type: 'string' },
              tagline: { type: 'string' },
              styleDescription: { type: 'string' },
              signatureTechniques: { type: 'array', items: { type: 'string' } },
              exampleSongs: { type: 'array', items: { type: 'string' } },
              preferredKeys: { type: 'array', items: { type: 'string' } },
              promptTemplate: { type: 'string' },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as GeneratedProfile;
    parsed.slug = slugifyMusicianName(parsed.slug || trimmedName);
    parsed.displayName = parsed.displayName || trimmedName;
    parsed.aliases = parsed.aliases.length > 0 ? parsed.aliases : [trimmedName];
    return parsed;
  } catch {
    return buildFallbackProfile(input);
  }
}
