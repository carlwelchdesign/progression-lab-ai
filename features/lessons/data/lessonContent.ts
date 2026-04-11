import type { Lesson } from '../types';

export const LESSONS: Lesson[] = [
  // ── Beginner ─────────────────────────────────────────────────────────────
  {
    id: 'what-are-chords',
    skillLevel: 'beginner',
    title: 'What Are Chords?',
    description:
      'Learn what a chord is, how it is built from intervals, and why chords are the foundation of harmony.',
    durationMinutes: 5,
    component: 'text',
    content: {
      intro:
        'A chord is three or more notes played at the same time. The way those notes are spaced apart — their intervals — gives each chord its distinctive sound and emotional colour.',
      steps: [
        {
          heading: 'Intervals: the building blocks',
          body: 'An interval is the distance between two notes. The most important intervals for chords are the major third (4 semitones), the minor third (3 semitones), and the perfect fifth (7 semitones).',
          tip: 'A semitone is the distance between any two adjacent keys on a piano, including black keys.',
        },
        {
          heading: 'Triads: the simplest chord',
          body: 'A triad stacks two thirds on top of a root note. A major triad (root + major 3rd + minor 3rd) sounds bright and stable. A minor triad (root + minor 3rd + major 3rd) sounds darker and more introspective.',
        },
        {
          heading: 'The root determines the name',
          body: 'The lowest note of a chord in its most basic form is called the root. A chord built on C with a major triad is called C major. A chord built on A with a minor triad is called A minor.',
        },
        {
          heading: 'Extensions: beyond the triad',
          body: 'Adding another third on top of a triad creates a seventh chord. Adding yet another third creates a ninth chord. These extensions add colour and sophistication — jazz and R&B make heavy use of them.',
          tip: 'The chord "Cmaj7" means: C major triad with a major seventh (B) on top.',
        },
      ],
      summary:
        'Chords are stacked intervals. Major and minor triads are the starting point; seventh chords add richness. The root note names the chord.',
      relatedChords: ['C', 'Am', 'G', 'Em'],
    },
  },
  {
    id: 'major-minor',
    skillLevel: 'beginner',
    title: 'Major vs Minor: The Emotional Difference',
    description:
      'Discover why major chords feel bright and minor chords feel dark — and how to use both expressively.',
    durationMinutes: 6,
    component: 'text',
    content: {
      intro:
        'Of all the distinctions in music, major versus minor is the one listeners perceive most immediately. Understanding what causes this difference gives you conscious control over the emotional palette of your music.',
      steps: [
        {
          heading: 'The one-semitone difference',
          body: 'A major chord and its minor counterpart differ by exactly one note: the third. Lower the third of a major chord by one semitone and it becomes minor. This single change — one half step — shifts the emotional character dramatically.',
        },
        {
          heading: 'Major: brightness and resolution',
          body: 'Major chords are associated with joy, stability, and resolution. The major third sits naturally in the harmonic overtone series, which is why it sounds "at rest" to our ears.',
        },
        {
          heading: 'Minor: tension and introspection',
          body: 'Minor chords feel more tense, melancholic, or mysterious. This is not a universal emotional rule — many upbeat songs use minor keys — but the contrast with major is always present.',
        },
        {
          heading: 'Mixing major and minor',
          body: 'The most emotionally rich music combines both. A passage that moves from a minor chord to its relative major (e.g., Am to C) creates a sense of lifting or brightening without leaving the same key.',
          tip: 'Every major key has a relative minor that shares all the same notes. C major and A minor use exactly the same seven notes.',
        },
        {
          heading: 'Context matters most',
          body: 'The same chord can feel resolved or tense depending on what surrounds it. A C major chord feels like home in C major but sounds surprising when it appears in A minor. Always listen for the relationship between chords, not just their individual character.',
        },
      ],
      summary:
        "Major and minor differ by one semitone on the third. Major is brighter; minor is darker. The interplay between the two is one of harmony's most powerful tools.",
      relatedChords: ['C', 'Cm', 'Am', 'A'],
    },
  },
  {
    id: 'circle-of-fifths',
    skillLevel: 'beginner',
    title: 'The Circle of Fifths',
    description:
      'Explore the Circle of Fifths interactively — understand key signatures, key relationships, and how to use it for songwriting.',
    durationMinutes: 10,
    component: 'cof',
  },

  // ── Intermediate ─────────────────────────────────────────────────────────
  {
    id: 'diatonic-chords',
    skillLevel: 'intermediate',
    title: 'Diatonic Chord Functions',
    description:
      'Learn the seven chords built from a major scale and how their roles (tonic, subdominant, dominant) shape harmonic movement.',
    durationMinutes: 8,
    component: 'text',
    content: {
      intro:
        'Every major key contains seven diatonic chords — one built on each scale degree. Each chord has a harmonic function that describes its role in creating tension and resolution.',
      steps: [
        {
          heading: 'The three functions',
          body: 'Tonic chords (I, iii, vi) provide rest and stability. Subdominant chords (II, IV) create mild tension and motion away from home. Dominant chords (V, vii°) create strong tension that resolves back to the tonic.',
        },
        {
          heading: 'Roman numeral notation',
          body: 'Chords are labelled with Roman numerals indicating their scale degree. Upper case (I, IV, V) means major; lower case (ii, iii, vi) means minor. The vii° is diminished.',
        },
        {
          heading: 'The I–IV–V progression',
          body: 'The most common progression in Western music. It cycles through all three functions: tonic (I) → subdominant (IV) → dominant (V) → back to tonic (I). Blues, rock, and country are built on this foundation.',
          tip: 'In C major: C – F – G – C. Try substituting the vi chord (Am) for the I to give it a minor colour.',
        },
        {
          heading: 'The vi chord: the tonic substitute',
          body: 'The vi chord (e.g., Am in C major) shares two notes with the I chord. It can substitute for the I when you want the stability of tonic with a slightly melancholic colour. The I–V–vi–IV progression is behind hundreds of pop songs.',
        },
        {
          heading: 'Extending to seventh chords',
          body: 'Diatonic seventh chords add richness. In C major: Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7b5. The G7 (dominant seventh) has especially strong pull back to Cmaj7.',
        },
      ],
      summary:
        'Diatonic chords have functions: tonic, subdominant, and dominant. Understanding these functions lets you predict and control how progressions feel.',
      relatedChords: ['Cmaj7', 'Dm7', 'Fmaj7', 'G7', 'Am7'],
    },
  },
  {
    id: 'ii-v-i',
    skillLevel: 'intermediate',
    title: 'The ii–V–I Progression',
    description:
      "Jazz's most fundamental harmonic movement — why it works, how to hear it, and how to use it in any style.",
    durationMinutes: 7,
    component: 'text',
    content: {
      intro:
        'The ii–V–I is the engine of jazz harmony and one of the most satisfying cadences in all of music. Understanding it opens doors to jazz, neo-soul, bossa nova, and sophisticated pop.',
      steps: [
        {
          heading: 'The anatomy of ii–V–I',
          body: 'In C major, the ii–V–I is Dm7 → G7 → Cmaj7. The ii chord moves a perfect fourth up to the V (or a fifth down), and the V resolves a perfect fourth up to the I. This chain of fourths is the most natural motion in tonal harmony.',
        },
        {
          heading: "Why it's so satisfying",
          body: 'The V7 chord contains a tritone (e.g., in G7 the notes B and F are a tritone apart). This interval is highly unstable and wants to resolve — B moves up to C and F moves down to E, landing directly on the I chord.',
          tip: "The tritone resolution is why the ii–V–I feels so inevitable. Composers use it to create a 'home arrival' feeling.",
        },
        {
          heading: 'The minor ii–V–i',
          body: 'In minor keys the ii chord becomes a half-diminished chord (m7b5) and the I chord becomes a minor seventh. In C minor: Dm7b5 → G7 → Cm7. The G7 often has an altered fifth or ninth for added tension.',
        },
        {
          heading: 'ii–V–I across keys',
          body: 'The same pattern works in every key. In G major: Am7 → D7 → Gmaj7. In F major: Gm7 → C7 → Fmaj7. Recognising this pattern by ear is a core skill for jazz musicians.',
        },
        {
          heading: 'Using it in non-jazz contexts',
          body: 'The ii–V–I appears in pop, R&B, and film music wherever there is a moment of emotional arrival. You can use just the ii–V (without the I) to create tension that resolves later, or chain multiple ii–V–Is together to move through several key centres.',
        },
      ],
      summary:
        'ii–V–I chains subdominant, dominant, and tonic functions. The tritone in the V7 chord drives resolution. It works in every key and every genre.',
      relatedChords: ['Dm7', 'G7', 'Cmaj7'],
    },
  },
  {
    id: 'modal-color',
    skillLevel: 'intermediate',
    title: 'Adding Modal Colour',
    description:
      'Use Dorian, Mixolydian, and Lydian modes to give your progressions distinctive flavours without leaving the key.',
    durationMinutes: 9,
    component: 'text',
    content: {
      intro:
        'Modes are scales built on different degrees of the major scale. Each mode has a characteristic sound that you can borrow to colour your progressions without fully modulating to a new key.',
      steps: [
        {
          heading: 'What makes a mode',
          body: 'A mode is a major scale starting from a different root. D Dorian uses the same notes as C major but treats D as home. This shifts which intervals are above the tonic, creating a different character.',
        },
        {
          heading: 'Dorian: minor with a raised sixth',
          body: 'Dorian is built on the second degree. It sounds like a natural minor scale with a raised sixth — giving it a cooler, more hip quality. Most funk, rock, and jazz minor grooves use Dorian. Characteristic chord: i minor – IV major (e.g., Dm – G).',
          tip: "Santana's 'Oye Como Va', Miles Davis's 'So What', and countless funk bass lines are Dorian.",
        },
        {
          heading: 'Mixolydian: major with a flat seventh',
          body: 'Mixolydian is built on the fifth degree. It sounds major but with a lowered seventh — giving it a bluesy, rock quality. The characteristic chord is I major – bVII major (e.g., G – F). Most rock riffs and classic rock songs live here.',
        },
        {
          heading: 'Lydian: major with a raised fourth',
          body: 'Lydian is built on the fourth degree. The raised fourth gives it a dreamy, floating, cinematic quality. Film composers (John Williams, Hans Zimmer) use Lydian for wonder and magic. Characteristic sound: Imaj7 with a #11 (raised fourth).',
        },
        {
          heading: 'Modal mixture',
          body: 'You do not need to stay in one mode for an entire song. Borrowing a characteristic chord from a parallel mode is called modal mixture. E.g., in C major, borrowing bVII (Bb major) from C Mixolydian gives an immediate rock flavour.',
        },
      ],
      summary:
        'Modes are flavours of the major scale. Dorian is dark-cool, Mixolydian is bright-bluesy, Lydian is dreamy. Borrowing modal chords adds colour without full modulation.',
      relatedChords: ['Dm7', 'G7', 'Gmaj7', 'F', 'Cmaj7#11'],
    },
  },

  // ── Advanced ─────────────────────────────────────────────────────────────
  {
    id: 'secondary-dominants',
    skillLevel: 'advanced',
    title: 'Secondary Dominants & Borrowed Chords',
    description:
      'Learn to temporarily tonicise any chord in the key using secondary dominants, and enrich your palette by borrowing from parallel modes.',
    durationMinutes: 10,
    component: 'text',
    content: {
      intro:
        'Secondary dominants and modal borrowing are two of the most practical tools for moving beyond basic diatonic harmony. They explain chord progressions that "should not work" by the rules yet sound completely natural.',
      steps: [
        {
          heading: 'What is a secondary dominant?',
          body: 'A secondary dominant is a dominant seventh chord that resolves to a chord other than the tonic. V7/V in C major is D7 — it resolves to G (the V chord). You are temporarily treating G as a local tonic.',
          tip: 'Any diatonic chord except the diminished can be tonicised. V7/ii, V7/iii, V7/IV, V7/V, V7/vi are all common.',
        },
        {
          heading: 'The tritone pull in any key centre',
          body: 'Secondary dominants work for the same reason as regular dominants: their tritone wants to resolve. D7 resolves to G because C# wants to become D and G wants to become F#. The ear hears this as a temporary shift to G major.',
        },
        {
          heading: 'Chromatic approach: the V7/IV',
          body: 'One of the most common secondary dominants is V7/IV — in C major, this is C7 (C–E–G–Bb). The moment you flatten the seventh of the I chord you create motion toward F. Countless gospel and R&B progressions use this move.',
        },
        {
          heading: 'Borrowed chords (modal mixture)',
          body: 'Borrowing chords from the parallel minor is the most common form of modal mixture. In C major, the bVII (Bb), bVI (Ab), and iv (Fm) all come from C minor. These chords introduce chromatic colour while maintaining a tonal centre.',
        },
        {
          heading: 'The backdoor dominant',
          body: 'The "backdoor" dominant is the bVII7 chord (e.g., Bb7 in C major) resolving to I. Instead of the tritone resolution of G7→C, it uses voice leading from the minor seventh above. Used heavily in jazz and soul for a smoother, darker resolution.',
        },
      ],
      summary:
        'Secondary dominants tonicise any chord temporarily. Borrowed chords from parallel modes add chromatic richness. Both tools are explained by the tritone and voice-leading principles.',
      relatedChords: ['D7', 'G7', 'C7', 'Fmaj7', 'Bb7', 'Cmaj7'],
    },
  },
  {
    id: 'tritone-substitution',
    skillLevel: 'advanced',
    title: 'Tritone Substitution & Reharmonisation',
    description:
      'Replace dominant chords with their tritone substitutes to create chromatic bass lines and unexpected harmonic colours.',
    durationMinutes: 12,
    component: 'text',
    content: {
      intro:
        'Tritone substitution is one of the most elegant ideas in jazz harmony: any dominant seventh chord can be replaced by another dominant seventh chord a tritone away, because both share the same tritone interval — just flipped.',
      steps: [
        {
          heading: 'The shared tritone',
          body: 'G7 contains the notes B and F — a tritone apart. Db7 (a tritone away from G) contains C and Gb. But Gb is the same pitch as F#, which is enharmonically equivalent to F#. And C resolves to B. So the resolution notes are the same — just swapped in role.',
        },
        {
          heading: 'The tritone substitute in ii–V–I',
          body: 'In a ii–V–I in C major (Dm7 – G7 – Cmaj7), you can replace G7 with Db7: Dm7 – Db7 – Cmaj7. The bass moves chromatically: D → Db → C. This creates a smooth descending bass line that became a hallmark of bebop.',
          tip: 'The chromatic bass line is one reason tritone subs are so popular — they create motion even without melodic activity.',
        },
        {
          heading: 'Applying tritone subs to secondary dominants',
          body: 'Any dominant seventh — primary or secondary — can be tritone-substituted. V7/ii (D7 → Am7) can become Ab7 → Am7. The unexpected flat-II chord creates a dramatic shift in colour while still resolving correctly.',
        },
        {
          heading: 'Reharmonisation beyond the tritone sub',
          body: 'Reharmonisation means replacing a chord with a different chord that supports the melody note. The melody note is preserved; the harmonic context around it changes. The tritone sub is one approach; others include using the parallel minor chord, the relative major or minor, or a completely non-functional chord chosen for colour.',
        },
        {
          heading: 'Listening and application',
          body: 'Tritone substitution is abstract until you hear it. The move Dm7 – Db7 – Cmaj7 is instantly recognisable once you have heard it a few times. Try applying it in the generator: replace any G7 with a Db7 and listen for the chromatic bass pull.',
        },
      ],
      summary:
        'Tritone subs work because the tritone in a dominant seventh chord is shared — just inverted — with the chord a tritone away. The result is chromatic bass motion and unexpected harmonic colour.',
      relatedChords: ['Dm7', 'Db7', 'Cmaj7', 'G7'],
    },
  },
];

export const LESSONS_BY_SKILL = {
  beginner: LESSONS.filter((l) => l.skillLevel === 'beginner'),
  intermediate: LESSONS.filter((l) => l.skillLevel === 'intermediate'),
  advanced: LESSONS.filter((l) => l.skillLevel === 'advanced'),
} as const;
