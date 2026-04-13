// ── Types ─────────────────────────────────────────────────────────────────────

export type CourseExercise = {
  id: string;
  prompt: string; // "Play this chord"
  chord: string; // chord symbol passed to ChordMatchExercise
  hint?: string;
  /** Override the notes to match. Use for single-note exercises where chord voicing would require too many notes. */
  targetNotes?: string[];
};

export type CourseLessonStep =
  | { type: 'text'; heading: string; body: string; tip?: string }
  | { type: 'exercise'; exercise: CourseExercise };

export type CourseLesson = {
  id: string;
  title: string;
  estimatedMinutes: number;
  steps: CourseLessonStep[];
};

export type CourseUnit = {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
};

// ── Course content ────────────────────────────────────────────────────────────

export const COURSE_UNITS: CourseUnit[] = [
  {
    id: 'unit-1',
    title: 'The Keyboard',
    description:
      'Learn to navigate the piano keyboard, understand octaves, and play your first notes.',
    lessons: [
      {
        id: 'lesson-keys',
        title: 'White keys and black keys',
        estimatedMinutes: 5,
        steps: [
          {
            type: 'text',
            heading: 'The piano layout',
            body: 'A standard piano has 88 keys arranged in a repeating pattern of 7 white keys and 5 black keys. The white keys are named A through G; the black keys are sharps (#) or flats (♭) depending on context.',
          },
          {
            type: 'text',
            heading: 'Finding C',
            body: 'C is always the white key immediately to the left of a group of 2 black keys. Middle C sits near the centre of a full keyboard, and is called C4 (the 4th octave). Find it on the diagram below.',
            tip: 'Every C looks the same — a white key just left of the 2-black-key cluster. Use this as your anchor.',
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-c4',
              prompt: 'Play middle C',
              chord: 'C',
              hint: 'Just the single note C4 — the white key left of the two black keys in the middle of your keyboard.',
              targetNotes: ['C4'],
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-g4',
              prompt: 'Now play G',
              chord: 'G',
              hint: 'G is 5 white keys to the right of C, or just left of the group of 3 black keys.',
              targetNotes: ['G4'],
            },
          },
        ],
      },
      {
        id: 'lesson-octaves',
        title: 'Octaves and note names',
        estimatedMinutes: 5,
        steps: [
          {
            type: 'text',
            heading: 'What is an octave?',
            body: "When you double a note's frequency you get the same note one octave higher. C3, C4, and C5 are all C — just in different registers. The number tells you which octave you're in: C4 is middle C, C5 is one octave above it.",
          },
          {
            type: 'text',
            heading: 'The 7 note names',
            body: 'Western music uses 7 letter names: C D E F G A B. After B the pattern repeats with C again, one octave higher. The 5 black keys fill in the gaps: C# D# F# G# A# (or their flat equivalents Db Eb Gb Ab Bb).',
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-c5',
              prompt: 'Play C one octave above middle C',
              chord: 'C',
              hint: 'Count up 8 white keys from C4, or find the next C above middle C.',
              targetNotes: ['C5'],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'unit-2',
    title: 'Your First Chords',
    description:
      'Build major and minor triads with both hands and understand why they sound the way they do.',
    lessons: [
      {
        id: 'lesson-major-triad',
        title: 'The major triad',
        estimatedMinutes: 8,
        steps: [
          {
            type: 'text',
            heading: 'What is a chord?',
            body: 'A chord is three or more notes played together. The simplest chord is the triad — root, third, fifth. The root gives the chord its name; the third determines the emotional quality (major = bright, minor = darker).',
          },
          {
            type: 'text',
            heading: 'Building a C major triad',
            body: 'Start on C, skip a white key to E, skip another to G. Those three notes — C E G — form C major. The gap between C and E is a major third (4 semitones); between E and G is a minor third (3 semitones).',
            tip: 'Finger 1-3-5 (thumb, middle, pinky) is the standard fingering for a triad in root position.',
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-cmaj',
              prompt: 'Play a C major chord',
              chord: 'C',
              hint: 'C, E, and G together. Thumb on C, middle finger on E, pinky on G.',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-gmaj',
              prompt: 'Play a G major chord',
              chord: 'G',
              hint: 'G, B, and D. Same shape as C major but starting on G.',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-fmaj',
              prompt: 'Play an F major chord',
              chord: 'F',
              hint: "F, A, and C. Watch for the C — it's the octave above middle C.",
            },
          },
        ],
      },
      {
        id: 'lesson-minor-triad',
        title: 'The minor triad',
        estimatedMinutes: 8,
        steps: [
          {
            type: 'text',
            heading: 'Lowering the third',
            body: 'A minor triad is built exactly like a major triad except the middle note (the third) is lowered by one semitone. For C minor: C, E♭, G. The Eb is one black key to the left of E.',
            tip: 'Minor chords are often described as "sadder" or "darker" — this comes entirely from that one semitone difference.',
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-amin',
              prompt: 'Play an A minor chord',
              chord: 'Am',
              hint: 'A, C, and E. A minor uses all white keys, making it a natural starting point.',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-dmin',
              prompt: 'Play a D minor chord',
              chord: 'Dm',
              hint: 'D, F, and A. All white keys again.',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-emin',
              prompt: 'Play an E minor chord',
              chord: 'Em',
              hint: 'E, G, and B. All white keys.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'unit-3',
    title: 'Basic Progressions',
    description: 'Chain chords into progressions — the backbone of every song.',
    lessons: [
      {
        id: 'lesson-i-iv-v',
        title: 'The I – IV – V progression',
        estimatedMinutes: 10,
        steps: [
          {
            type: 'text',
            heading: 'Why I – IV – V works',
            body: 'The three most important chords in any key are built on the 1st, 4th, and 5th notes of the scale. In C major: C (I), F (IV), G (V). Nearly every blues, rock, and country song uses these three chords.',
          },
          {
            type: 'text',
            heading: 'The tension and release cycle',
            body: 'The V chord (G in C major) creates tension that wants to resolve back to I (C). This tension-release motion is the engine of tonal music. The IV chord adds colour and motion before the V.',
            tip: 'Listen for this in familiar songs: most choruses are built around this resolution.',
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-i-c',
              prompt: 'Play the I chord (C major)',
              chord: 'C',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-iv-f',
              prompt: 'Play the IV chord (F major)',
              chord: 'F',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-v-g',
              prompt: 'Play the V chord (G major)',
              chord: 'G',
            },
          },
        ],
      },
      {
        id: 'lesson-pop-progression',
        title: 'The I – V – vi – IV progression',
        estimatedMinutes: 10,
        steps: [
          {
            type: 'text',
            heading: 'The most popular chord progression',
            body: 'I – V – vi – IV (in C major: C, G, Am, F) underlies thousands of pop songs. It works because the vi (A minor) is the relative minor of C — sharing the same notes — creating an emotional contrast without leaving the key.',
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-pop-c',
              prompt: 'C major — the I chord',
              chord: 'C',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-pop-g',
              prompt: 'G major — the V chord',
              chord: 'G',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-pop-am',
              prompt: 'A minor — the vi chord',
              chord: 'Am',
            },
          },
          {
            type: 'exercise',
            exercise: {
              id: 'ex-pop-f',
              prompt: 'F major — the IV chord',
              chord: 'F',
            },
          },
        ],
      },
    ],
  },
];

// Flat list of all lesson IDs → unit for lookup
export const LESSON_UNIT_MAP = new Map<string, string>(
  COURSE_UNITS.flatMap((unit) => unit.lessons.map((lesson) => [lesson.id, unit.id])),
);
