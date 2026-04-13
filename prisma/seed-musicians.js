/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PROMPT_TEMPLATE = `You are generating piano lessons in the style of {{displayName}}.
Output strict JSON only.
Each lesson must follow this 6-step sequence:
1) Hook
2) Concept
3) Hear + See It
4) Try It
5) Why It Works
6) Real Song Connection
Exercise steps must include targetNotes for MIDI confirmation.`;

const SEEDED_MUSICIANS = [
  {
    slug: 'stevie-wonder',
    displayName: 'Stevie Wonder',
    aliases: ['Stevie', 'Wonder'],
    genre: 'Soul / R&B',
    era: '1970s-present',
    tagline: 'Minor 9th grooves and soulful harmonic color.',
    styleDescription: 'Warm, rhythmic left hand and rich chord extensions.',
    signatureTechniques: ['Minor 9th voicings', 'Chromatic approach notes', 'Syncopated comping'],
    exampleSongs: ['Superstition', "Isn't She Lovely", 'Sir Duke'],
    preferredKeys: ['Eb', 'Bb', 'Ab'],
    promptTemplate: PROMPT_TEMPLATE,
    promptVersion: 2,
    sortOrder: 1,
  },
  {
    slug: 'herbie-hancock',
    displayName: 'Herbie Hancock',
    aliases: ['Herbie'],
    genre: 'Jazz / Fusion',
    era: '1960s-present',
    tagline: 'Modern jazz harmony and rhythmic invention.',
    styleDescription: 'Quartal colors, modal motion, and dynamic phrasing.',
    signatureTechniques: ['Quartal voicings', 'Modal interchange', 'Rhythmic displacement'],
    exampleSongs: ['Cantaloupe Island', 'Maiden Voyage', 'Chameleon'],
    preferredKeys: ['F minor', 'D minor', 'Bb'],
    promptTemplate: PROMPT_TEMPLATE,
    promptVersion: 2,
    sortOrder: 2,
  },
  {
    slug: 'elton-john',
    displayName: 'Elton John',
    aliases: ['Elton'],
    genre: 'Rock / Pop',
    era: '1970s-present',
    tagline: 'Big left-hand patterns and cinematic chord movement.',
    styleDescription: 'Energetic accompaniment and memorable melodic hooks.',
    signatureTechniques: ['Stride-inspired left hand', 'Anthemic voicings', 'Voice leading'],
    exampleSongs: ['Tiny Dancer', 'Your Song', 'Bennie and the Jets'],
    preferredKeys: ['C', 'G', 'A'],
    promptTemplate: PROMPT_TEMPLATE,
    promptVersion: 2,
    sortOrder: 3,
  },
  {
    slug: 'paul-mccartney',
    displayName: 'Paul McCartney',
    aliases: ['McCartney', 'Paul'],
    genre: 'Pop / Rock',
    era: '1960s-present',
    tagline: 'Song-first piano writing with elegant harmonic movement.',
    styleDescription: 'Melodic bass movement and lyrical accompaniment.',
    signatureTechniques: [
      'Walking bass under chords',
      'Passing diminished chords',
      'Melodic top lines',
    ],
    exampleSongs: ['Let It Be', 'Hey Jude', "Maybe I'm Amazed"],
    preferredKeys: ['C', 'F', 'G'],
    promptTemplate: PROMPT_TEMPLATE,
    promptVersion: 2,
    sortOrder: 4,
  },
];

async function main() {
  await Promise.all(
    SEEDED_MUSICIANS.map((musician) =>
      prisma.musicianProfile.upsert({
        where: { slug: musician.slug },
        update: {
          displayName: musician.displayName,
          aliases: musician.aliases,
          genre: musician.genre,
          era: musician.era,
          tagline: musician.tagline,
          styleDescription: musician.styleDescription,
          signatureTechniques: musician.signatureTechniques,
          exampleSongs: musician.exampleSongs,
          preferredKeys: musician.preferredKeys,
          promptTemplate: musician.promptTemplate,
          promptVersion: musician.promptVersion,
          sortOrder: musician.sortOrder,
          isActive: true,
          isCustom: false,
        },
        create: {
          ...musician,
          isActive: true,
          isCustom: false,
        },
      }),
    ),
  );

  console.log('✅ Musician profiles seed completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
