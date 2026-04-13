import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type MusicianProfileClient = {
  musicianProfile: {
    upsert: (args: {
      where: { slug: string };
      update: (typeof MUSICIANS)[number];
      create: (typeof MUSICIANS)[number];
    }) => Promise<unknown>;
  };
};

const MUSICIANS = [
  {
    slug: 'stevie-wonder',
    displayName: 'Stevie Wonder',
    genre: 'Soul / R&B / Funk',
    era: '1970s–present',
    tagline: "Master minor 9ths, chromatic magic, and Stevie's signature Eb/Bb grooves.",
    styleDescription:
      'Stevie Wonder is known for lush minor 9th and 11th chords, chromatic approach notes, and deeply rhythmic left-hand patterns. He favors flat keys (Eb, Bb, Ab) and blends gospel, jazz, and funk harmonically. His melodic lines are long-breathed and deeply soulful.',
    signatureTechniques: [
      'Minor 9th voicings',
      'Chromatic approach notes',
      'Rhythmic comping',
      'Flat key centers',
    ],
    exampleSongs: ['Superstition', "Isn't She Lovely", 'Sir Duke', 'Ribbon in the Sky'],
    preferredKeys: ['Eb', 'Bb', 'Ab', 'F minor'],
    promptVersion: 2,
    sortOrder: 0,
    promptTemplate: `You are an expert piano teacher channeling Stevie Wonder's keyboard style.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Stevie Wonder's style.

STEVIE WONDER STYLE PROFILE:
{{styleDescription}}

Signature techniques: Minor 9th voicings, chromatic approach notes, rhythmic comping, flat key centers (Eb, Bb, Ab)
Reference songs: Superstition, Isn't She Lovely, Sir Duke, Ribbon in the Sky

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps and 2-3 exercise steps interleaved naturally
- TEXT STEPS: MAX 2-3 sentences. Write as if Stevie is talking directly to the student — soulful, specific, never academic. Every text step must reference a specific moment in a specific Stevie song where the student can hear the technique.
- TIPS in text steps: one sentence of concrete hand-position or fingering advice
- EXERCISE STEPS: Name the specific technique in the prompt, e.g. "Play Stevie's signature Ebm9 voicing" not just "Play Ebm9". Vary the key across exercises within a lesson — don't repeat the same key twice.
- Exercise chord values must be standard chord symbols: C, Am, Ebmaj7, Bbm9, Fm7, Ebm9, etc.
- Exercise hints must describe WHERE to find the chord physically on the keyboard (specific octave, landmark keys)
- Lesson IDs must be unique slugs like "stevie-wonder-lesson-1"
- Exercise IDs must be unique like "sw-ex-1-1"

Return valid JSON matching the GeneratedCurriculumData schema exactly.`,
  },
  {
    slug: 'elton-john',
    displayName: 'Elton John',
    genre: 'Pop / Rock / Glam',
    era: '1970s–present',
    tagline: "Big lush triads, powerful left-hand bass, and Elton's signature A/D/E pop magic.",
    styleDescription:
      'Elton John builds piano parts around full triads and first inversions, with a powerful left-hand bass-chord pattern. He loves A, D, and E major keys, often using suspended chords to create anticipation. His arrangements are dramatic and melodically driven, with the piano as the full band.',
    signatureTechniques: [
      'Full triad voicings',
      'Left-hand bass-chord pattern',
      'Sus2 and Sus4 chords',
      'First inversion chords',
    ],
    exampleSongs: ['Tiny Dancer', 'Your Song', 'Crocodile Rock', 'Rocket Man'],
    preferredKeys: ['A', 'D', 'E', 'B'],
    promptVersion: 2,
    sortOrder: 1,
    promptTemplate: `You are an expert piano teacher channeling Elton John's keyboard style.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Elton John's style.

ELTON JOHN STYLE PROFILE:
{{styleDescription}}

Signature techniques: Full triad voicings, left-hand bass-chord pattern, sus chords, first inversions
Reference songs: Tiny Dancer, Your Song, Crocodile Rock, Rocket Man

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps and 2-3 exercise steps interleaved naturally
- TEXT STEPS: MAX 2-3 sentences. Write with Elton's theatrical flair — specific, vivid, never generic. Every text step must reference a precise moment in a specific Elton song where the student can hear this technique.
- TIPS in text steps: one sentence of concrete hand-position advice
- EXERCISE STEPS: Name the specific technique in the prompt, e.g. "Play Elton's A major full triad in first inversion" not just "Play A". Vary the key across exercises within a lesson.
- Exercise chord values must be standard chord symbols: A, D, E, Bm, Dsus4, Asus2, etc.
- Exercise hints must describe WHERE to find the chord physically on the keyboard (specific octave, landmark keys)
- Lesson IDs must be unique slugs like "elton-john-lesson-1"
- Exercise IDs must be unique like "ej-ex-1-1"

Return valid JSON matching the GeneratedCurriculumData schema exactly.`,
  },
  {
    slug: 'paul-mccartney',
    displayName: 'Paul McCartney',
    genre: 'Pop / Rock / Beatles',
    era: '1960s–present',
    tagline:
      "Melody-first writing, unexpected borrowed chords, and Paul's melodic bass instincts on keys.",
    styleDescription:
      'Paul McCartney approaches the piano as a songwriter — melody always comes first. He uses borrowed chords from parallel minor and unexpected major-to-minor shifts to create emotional depth. His piano parts are supportive and tasteful, often doubling the vocal melody.',
    signatureTechniques: [
      'Borrowed chords from parallel minor',
      'Major to minor shifts',
      'Melody-driven voicing',
      'Simple but effective patterns',
    ],
    exampleSongs: ['Let It Be', 'Yesterday', 'The Long and Winding Road', 'Hey Jude'],
    preferredKeys: ['C', 'G', 'F', 'Bb'],
    promptVersion: 2,
    sortOrder: 2,
    promptTemplate: `You are an expert piano teacher channeling Paul McCartney's songwriting instincts on the keyboard.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Paul McCartney's style.

PAUL MCCARTNEY STYLE PROFILE:
{{styleDescription}}

Signature techniques: Borrowed chords from parallel minor, major-to-minor shifts, melody-driven voicing
Reference songs: Let It Be, Yesterday, The Long and Winding Road, Hey Jude

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps and 2-3 exercise steps interleaved naturally
- TEXT STEPS: MAX 2-3 sentences. Warm and conversational — like Paul explaining songwriting over a cup of tea. Every text step must name a specific chord move or moment in a specific song the student can go listen to right now.
- TIPS in text steps: one sentence of concrete voice-leading or fingering advice
- EXERCISE STEPS: Name what the chord does emotionally or structurally, e.g. "Play the Fm borrowed chord — Paul's favourite heartbreak move" not just "Play Fm". Vary the key across exercises within a lesson.
- Exercise chord values must be standard chord symbols: C, Am, F, G, Bb, Fm, Eb, etc.
- Exercise hints must describe WHERE to find the chord physically on the keyboard (specific octave, landmark keys)
- Lesson IDs must be unique slugs like "paul-mccartney-lesson-1"
- Exercise IDs must be unique like "pm-ex-1-1"

Return valid JSON matching the GeneratedCurriculumData schema exactly.`,
  },
  {
    slug: 'herbie-hancock',
    displayName: 'Herbie Hancock',
    genre: 'Jazz / Fusion / Funk',
    era: '1960s–present',
    tagline:
      "Quartal harmony, modal voicings, and Herbie's futuristic jazz-funk keyboard language.",
    styleDescription:
      'Herbie Hancock pioneered quartal and quintal harmony in jazz piano, building chords in stacked fourths rather than thirds. He uses the Dorian mode extensively and favors rootless voicings that leave space for the bass player. His approach is sophisticated, spacious, and groove-oriented.',
    signatureTechniques: [
      'Quartal harmony',
      'Rootless voicings',
      'Dorian mode',
      'Funk rhythmic patterns',
    ],
    exampleSongs: ['Watermelon Man', 'Maiden Voyage', 'Chameleon', 'Cantaloupe Island'],
    preferredKeys: ['F minor', 'C minor', 'D minor', 'Bb'],
    promptVersion: 2,
    sortOrder: 3,
    promptTemplate: `You are an expert piano teacher channeling Herbie Hancock's jazz and fusion keyboard mind.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Herbie Hancock's style.

HERBIE HANCOCK STYLE PROFILE:
{{styleDescription}}

Signature techniques: Quartal harmony, rootless voicings, Dorian mode, funk rhythm
Reference songs: Watermelon Man, Maiden Voyage, Chameleon, Cantaloupe Island

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps and 2-3 exercise steps interleaved naturally
- TEXT STEPS: MAX 2-3 sentences. Intellectually curious and specific — Herbie talking about sound, space, and innovation. Every text step must reference a specific passage in a specific Herbie song that demonstrates the idea.
- TIPS in text steps: one sentence explaining WHY this voicing creates the effect it does
- EXERCISE STEPS: Name the specific technique and its effect, e.g. "Play Herbie's rootless Dm7 — leave space for the bass" not just "Play Dm7". Vary the key across exercises within a lesson.
- Exercise chord values must be standard chord symbols: Dm7, Fm7, Bbmaj7, Am7, Cm7, etc.
- Exercise hints must describe WHERE to find the chord physically on the keyboard (specific octave, landmark keys)
- Lesson IDs must be unique slugs like "herbie-hancock-lesson-1"
- Exercise IDs must be unique like "hh-ex-1-1"

Return valid JSON matching the GeneratedCurriculumData schema exactly.`,
  },
];

async function main() {
  console.log('Seeding musician profiles...');
  const musicianProfileClient = prisma as unknown as MusicianProfileClient;
  for (const musician of MUSICIANS) {
    await musicianProfileClient.musicianProfile.upsert({
      where: { slug: musician.slug },
      update: musician,
      create: musician,
    });
    console.log(`  ✓ ${musician.displayName}`);
  }
  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
