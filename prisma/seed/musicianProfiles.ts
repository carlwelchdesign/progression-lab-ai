import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    promptVersion: 1,
    sortOrder: 0,
    promptTemplate: `You are an expert piano teacher specializing in Stevie Wonder's keyboard style.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Stevie Wonder's style.

STEVIE WONDER STYLE PROFILE:
{{styleDescription}}

Signature techniques: Minor 9th voicings, chromatic approach notes, rhythmic comping, flat key centers (Eb, Bb, Ab)
Reference songs: Superstition, Isn't She Lovely, Sir Duke, Ribbon in the Sky

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps (music theory and style explanation) and 2-3 exercise steps (MIDI chord practice)
- Exercise chord values must be standard chord symbols that a chord parser understands: C, Am, Ebmaj7, Bbm9, Fm7, etc.
- Exercise hints must describe where to physically find the chord on the piano keyboard
- Text steps must sound like Stevie himself would explain it — soulful, encouraging, not academic
- Tips in text steps should be practical technique advice
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
    promptVersion: 1,
    sortOrder: 1,
    promptTemplate: `You are an expert piano teacher specializing in Elton John's keyboard style.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Elton John's style.

ELTON JOHN STYLE PROFILE:
{{styleDescription}}

Signature techniques: Full triad voicings, left-hand bass-chord pattern, sus chords, first inversions
Reference songs: Tiny Dancer, Your Song, Crocodile Rock, Rocket Man

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps (music theory and style explanation) and 2-3 exercise steps (MIDI chord practice)
- Exercise chord values must be standard chord symbols: C, Am, Dsus4, A, E, Bm, etc.
- Exercise hints must describe where to physically find the chord on the piano keyboard
- Text steps must be enthusiastic and theatrical — capture Elton's flamboyant spirit
- Tips in text steps should be practical technique advice for the left-hand/right-hand pattern
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
    promptVersion: 1,
    sortOrder: 2,
    promptTemplate: `You are an expert piano teacher specializing in Paul McCartney's songwriting and keyboard style.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Paul McCartney's style.

PAUL MCCARTNEY STYLE PROFILE:
{{styleDescription}}

Signature techniques: Borrowed chords from parallel minor, major-to-minor shifts, melody-driven voicing
Reference songs: Let It Be, Yesterday, The Long and Winding Road, Hey Jude

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps (music theory and style explanation) and 2-3 exercise steps (MIDI chord practice)
- Exercise chord values must be standard chord symbols: C, Am, F, G, Bb, Fm, etc.
- Exercise hints must describe where to physically find the chord on the piano keyboard
- Text steps should be warm and encouraging — capture the approachable, human quality of Paul's music
- Tips should focus on how to let the melody guide the piano arrangement
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
    promptVersion: 1,
    sortOrder: 3,
    promptTemplate: `You are an expert piano teacher specializing in Herbie Hancock's jazz and fusion keyboard style.
Generate a personalized piano curriculum for a {{skillLevel}} student who wants to play in Herbie Hancock's style.

HERBIE HANCOCK STYLE PROFILE:
{{styleDescription}}

Signature techniques: Quartal harmony, rootless voicings, Dorian mode, funk rhythm
Reference songs: Watermelon Man, Maiden Voyage, Chameleon, Cantaloupe Island

CURRICULUM REQUIREMENTS:
- Generate exactly 3 lessons of increasing difficulty appropriate for a {{skillLevel}} student
- Each lesson must have 2-3 text steps (music theory and style explanation) and 2-3 exercise steps (MIDI chord practice)
- Exercise chord values must be standard chord symbols: Dm7, Fm7, Bbmaj7, Am7, Cm7, etc.
- Exercise hints must describe where to physically find the chord on the piano keyboard
- Text steps should be intellectually curious and exploratory — capture Herbie's spirit of innovation
- Tips should explain the theory behind why these voicings work
- Lesson IDs must be unique slugs like "herbie-hancock-lesson-1"
- Exercise IDs must be unique like "hh-ex-1-1"

Return valid JSON matching the GeneratedCurriculumData schema exactly.`,
  },
];

async function main() {
  console.log('Seeding musician profiles...');
  for (const musician of MUSICIANS) {
    await prisma.musicianProfile.upsert({
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
