import type { Lesson } from '../types';

export const LESSONS: Lesson[] = [
  // ── Beginner ─────────────────────────────────────────────────────────────
  {
    id: 'what-are-chords',
    skillLevel: 'beginner',
    title: 'What Are Chords?',
    description:
      'Press three keys. Hear something new. Understand why it works — and why that opens everything.',
    durationMinutes: 5,
    component: 'text',
    content: {
      intro:
        "Press C, E, and G together right now. That sound — that three-note cluster — is C major. It's the building block of basically all Western music. In this lesson, you'll understand exactly why those notes work together.",
      steps: [
        {
          heading: 'Feel it first: C major',
          body: 'Hold C, E, and G at the same time. The gap between each note is called an interval, and those specific gaps are what give C major its sound. It feels settled, resolved — like the answer to a question. Play it and let it ring.',
          tip: 'C to E = 4 semitones (a major third). E to G = 3 semitones (a minor third). This 4-then-3 recipe creates every major chord, in any key.',
        },
        {
          heading: 'One note changes everything: A minor',
          body: "Now find A, C, and E together. That's A minor — and you can immediately feel the shift. Same type of structure, but starting from A, and the mood is darker, more introspective. A minor and C major actually share two of their three notes. The context changes the emotion.",
          tip: 'Play A minor then immediately play C major. Notice how C feels like "lifting" or "arriving home" after the minor chord.',
        },
        {
          heading: 'The root names the chord',
          body: "The lowest note in a chord's simplest form is the root — it's the chord's identity. G, B, D is G major (root = G). The name follows the root. Play G major now and notice: same bright character as C major, but the gravitational centre has shifted.",
          tip: 'Every chord name just tells you two things: the root note and the quality (major, minor, etc.). G major = root is G, quality is major.',
        },
        {
          heading: 'Add a fourth note: seventh chords',
          body: 'Take your triad and stack one more third on top — you get a seventh chord. E minor + the note D becomes Em7. This extra note adds richness and sophistication. Em7 is all over "Blackbird" by The Beatles, John Legend\'s ballads, and nearly every R&B track ever recorded.',
          tip: 'The number "7" in a chord name means a fourth note was added. Cmaj7, Am7, G7 — all richer versions of their basic triads.',
        },
      ],
      summary:
        'Chords are stacked intervals. The root note names the chord. Major (4+3 semitone recipe) sounds bright; minor (3+4) sounds darker. Adding a seventh creates a richer four-note chord. You now hear the foundation of all harmony.',
      relatedChords: ['C', 'Am', 'G', 'Em'],
    },
  },
  {
    id: 'major-minor',
    skillLevel: 'beginner',
    title: 'Major vs Minor',
    description:
      "One half-step lower is the most emotionally loaded change in music. Here's how to hear it — and use it.",
    durationMinutes: 6,
    component: 'text',
    content: {
      intro:
        'Major and minor are opposites. One feels like sunshine; the other feels like rain. The difference between them is literally one note — but that one note has driven the emotional character of music for centuries.',
      steps: [
        {
          heading: 'C major: the bright one',
          body: 'Play C, E, G together and hold it. This is C major — one of the most stable, resolved sounds in all of music. It\'s where "Hey Jude" ends, where "Let It Be" breathes. Bright, settled, answered. Feel it.',
          tip: 'C major sits at the heart of the C major scale (C D E F G A B). Playing all those notes feels natural because major is built into the harmonic overtone series.',
        },
        {
          heading: 'C minor: lower one note',
          body: "Find E♭ — the black key just to the left of E — and play C, E♭, G. That's C minor. One single note dropped by one half step, and the emotional character completely inverted. Same root, same fifth, one lowered third. This is it. This is the sound.",
          tip: 'The note that changes is called the third. Major third (4 semitones from root) = bright. Minor third (3 semitones from root) = dark.',
        },
        {
          heading: 'A minor: where half of pop lives',
          body: 'Now try A, C, E — A minor. This is one of the most-used chords in all of pop and rock. "Stairway to Heaven" opens on it. "Losing My Religion." "Hotel California." "Someone Like You." A minor sounds introspective, searching, emotionally rich. Play it slowly.',
          tip: 'A minor is the "relative minor" of C major — they share all the same notes (C D E F G A B), just played from a different home base.',
        },
        {
          heading: 'A major: the same root, opposite feeling',
          body: "Now play A, C#, E — that's A major. One note changed (C became C#), and the mood swings from introspection to triumph. A major is anthemic, confident. Compare A minor and A major back to back a few times. That is the major/minor divide in its purest form.",
          tip: 'This A minor vs A major comparison is one of the most useful things you can internalize. Your ear will start hearing this distinction everywhere.',
        },
        {
          heading: 'The real magic: mixing both',
          body: 'No great song stays all-major or all-minor. Moving from Am to C (minor to its relative major) is the "lift" you\'ve heard in hundreds of songs — it\'s the emotional arc of verse to chorus in pop music. The contrast is the point. You need the shadow to feel the light.',
          tip: 'Try: Am → C → G → Am. That four-chord loop is the harmonic skeleton behind "Africa" by Toto, "Mad World," and countless others.',
        },
      ],
      summary:
        'Major and minor differ by one note: the third. Major third (4 semitones) = bright and resolved. Minor third (3 semitones) = darker and searching. Mixing both in a progression creates the emotional arc that makes music compelling.',
      relatedChords: ['C', 'Cm', 'Am', 'A'],
    },
  },
  {
    id: 'circle-of-fifths',
    skillLevel: 'beginner',
    title: 'The Circle of Fifths',
    description:
      'The map of all music — understand key signatures, chord relationships, and how keys connect.',
    durationMinutes: 10,
    component: 'cof',
  },

  // ── Intermediate ─────────────────────────────────────────────────────────
  {
    id: 'diatonic-chords',
    skillLevel: 'intermediate',
    title: 'Diatonic Chord Functions',
    description:
      'Every key has 7 chords. Each one has a job. Understanding those jobs is how you write chord progressions that feel inevitable.',
    durationMinutes: 8,
    component: 'text',
    content: {
      intro:
        'Pick any major key and there are exactly seven chords that naturally "belong" there — no sharps or flats added. Each chord has a function: it either feels like home, wants to leave home, or desperately needs to return. That push and pull is harmony.',
      steps: [
        {
          heading: 'The three jobs: tonic, subdominant, dominant',
          body: 'Tonic chords (I, iii, vi) feel like home — stable, settled. Subdominant chords (II, IV) create gentle motion away from home. Dominant chords (V, vii°) create strong tension that must resolve back. Every chord progression is a story told in these three roles.',
          tip: 'Think of it like walking: tonic = standing still, subdominant = stepping away, dominant = the moment before you walk back in the door.',
        },
        {
          heading: 'Roman numeral notation',
          body: 'Chords are named by their scale degree with Roman numerals. In C major: I = Cmaj7, ii = Dm7, iii = Em7, IV = Fmaj7, V = G7, vi = Am7. Upper case = major quality; lower case = minor. This system works in every key — learn the pattern once, use it everywhere.',
          tip: 'The V chord (G7 in C major) has a tritone interval inside it that creates irresistible pull toward the I chord. This is the engine of tonal harmony.',
        },
        {
          heading: 'I–IV–V: the foundation of everything',
          body: "In C major: Cmaj7 → Fmaj7 → G7 → Cmaj7. This is the I–IV–V, the most common progression in all of Western music. Blues, country, rock'n'roll — it's all built on this. The G7 creates the tension; the return to Cmaj7 resolves it. Play it and feel the inevitability.",
          tip: 'Transpose I–IV–V to every key you know. In G major: G → C → D. In F major: F → Bb → C. Same emotional logic, different key centre.',
        },
        {
          heading: 'The vi chord: the tonic substitute',
          body: 'Am7 (vi in C major) shares two notes with Cmaj7 — C and E. It gives you the stability of tonic with a minor colour. The I–V–vi–IV progression (C–G–Am–F in C major) is behind literally hundreds of pop songs — Axis of Awesome made a famous medley proving it.',
          tip: 'Play Cmaj7 → Am7 back to back. Notice how Am7 still feels like "home" but sadder. This substitution is a primary colour of pop harmony.',
        },
        {
          heading: 'Seventh chords: colour the diatonic palette',
          body: 'Triads tell you where you are. Seventh chords tell you how it feels. In C major: Cmaj7 sounds warm and nostalgic, Dm7 sounds melancholic, G7 sounds urgent. The diatonic sevenths are the full emotional vocabulary of a key — learn all seven and you have complete expressive range.',
          tip: 'Fmaj7 is one of the most beautiful diatonic chords. It has a dreamy, wide-open quality. You hear it constantly in John Legend and neo-soul.',
        },
      ],
      summary:
        'Every major key has seven diatonic chords with three functions: tonic (home), subdominant (away), dominant (must-return). Roman numerals describe them by scale degree. Seventh chords add emotional colour to each function.',
      relatedChords: ['Cmaj7', 'Dm7', 'Fmaj7', 'G7', 'Am7'],
    },
  },
  {
    id: 'ii-v-i',
    skillLevel: 'intermediate',
    title: 'The ii–V–I Progression',
    description:
      "Jazz's most fundamental cadence — and the most satisfying resolution in all of music. Once you hear it, you'll never un-hear it.",
    durationMinutes: 7,
    component: 'text',
    content: {
      intro:
        "Dm7 → G7 → Cmaj7. Three chords, each a fourth apart. This is the ii–V–I — the engine of jazz harmony and one of the most emotionally satisfying sequences in all of tonal music. Learn this and you'll hear it everywhere.",
      steps: [
        {
          heading: 'Play it: Dm7 → G7 → Cmaj7',
          body: "Find Dm7 (D, F, A, C), then G7 (G, B, D, F), then Cmaj7 (C, E, G, B). Notice the sense of increasing tension and then release. The G7 is pulling hard toward the Cmaj7. When you arrive on Cmaj7, there's an unmistakable sense of arrival. That's the ii–V–I.",
          tip: 'Each chord is a fourth above the previous one: D to G is a fourth, G to C is a fourth. Chains of fourths are the most natural motion in tonal harmony.',
        },
        {
          heading: 'Why the G7 pulls so hard: the tritone',
          body: 'Inside G7, the notes B and F are exactly a tritone apart (6 semitones — the most dissonant interval). That tension is almost physically uncomfortable. B wants to rise to C; F wants to fall to E. Those two notes are the pull of the dominant, and they resolve directly into the Cmaj7.',
          tip: 'The tritone B–F in G7 resolves to the C–E interval in Cmaj7. Understanding this tritone resolution is the key to understanding all of tonal harmony.',
        },
        {
          heading: 'ii–V–I in minor: a darker flavour',
          body: 'In C minor, the ii chord becomes Dm7♭5 (half-diminished), and the target becomes Cm7. Dm7♭5 → G7 → Cm7. The G7 often has altered extensions (♭9, ♯9) for extra bite. Jazz ballads and film scores lean heavily on this minor ii–V–i for its deeper, more melancholic resolution.',
          tip: 'The G7alt (altered dominant) — G7 with ♭9 and ♯5 — is one of the most expressive chords in jazz. Its dissonance makes the Cm7 resolution feel earned.',
        },
        {
          heading: 'Recognising it in any key',
          body: "Am7 → D7 → Gmaj7 is a ii–V–I in G major. Gm7 → C7 → Fmaj7 is one in F major. The pattern is always the same: minor seventh a step above the tonic, dominant seventh a fifth above the tonic, then home. Train your ear on this pattern and you'll hear it in every jazz standard.",
          tip: 'Almost every jazz standard is a sequence of ii–V–I cadences moving through different key centres. "Autumn Leaves," "All The Things You Are," "Fly Me To The Moon" — they\'re all chains of ii–V–Is.',
        },
        {
          heading: 'Use it outside jazz',
          body: "The ii–V–I isn't just for jazz. It shows up in pop at moments of emotional arrival, in film scores for resolution, in bossa nova as the constant heartbeat. You can chain them — Dm7→G7→Cmaj7→Fmaj7→Bb7→Ebmaj7 — and move smoothly through multiple keys. Each new target feels earned.",
          tip: "Try just the ii–V without the I. Dm7→G7 with no resolution creates a hanging tension that's endlessly useful for verses that need to feel unresolved.",
        },
      ],
      summary:
        'ii–V–I is the most important cadence in tonal music. The tritone in the V7 chord creates irresistible pull toward the I. It works in major (Dm7–G7–Cmaj7) and minor (Dm7♭5–G7–Cm7). Once internalized, you hear it in every genre.',
      relatedChords: ['Dm7', 'G7', 'Cmaj7'],
    },
  },
  {
    id: 'modal-color',
    skillLevel: 'intermediate',
    title: 'Adding Modal Colour',
    description:
      'Dorian, Mixolydian, Lydian — flavours of the major scale that give your music instantly distinctive character.',
    durationMinutes: 9,
    component: 'text',
    content: {
      intro:
        "Modes aren't separate scales — they're the same notes as a major scale, just heard from a different starting point. Each mode has a characteristic sound you already know from music you love. Here's how to hear and use them.",
      steps: [
        {
          heading: 'What makes a mode: same notes, different home',
          body: 'D Dorian uses exactly the same notes as C major (C D E F G A B) but treats D as home. By changing which note feels like "one," the intervals above the root change — and so does the emotional character. Modes are about gravity, not new notes.',
          tip: 'This means you already know how to play every mode in C — just play the C major scale starting from D (Dorian), E (Phrygian), F (Lydian), G (Mixolydian), A (Aeolian/natural minor), or B (Locrian).',
        },
        {
          heading: 'Dorian: minor with a raised sixth',
          body: 'Dorian is the second mode — minor-sounding but with a raised 6th that gives it a cooler, less tragic quality than natural minor. Its characteristic move is i minor → IV major (Dm → G in D Dorian). This is Santana\'s "Oye Como Va," Miles Davis\'s "So What," and most funk bass lines.',
          tip: "Dm → G is the Dorian fingerprint. Play those two chords and listen to the G major chord — it doesn't feel like a dominant. It feels like a colour change.",
        },
        {
          heading: 'Mixolydian: major with a flat seventh',
          body: 'Mixolydian is the fifth mode — major-sounding but with a lowered 7th that gives it a bluesy, rock quality. Its characteristic move is I → ♭VII (G → F in G Mixolydian). "Sweet Home Chicago," "Gimme Shelter," "Sympathy for the Devil" — rock\'n\'roll lives in Mixolydian.',
          tip: "The ♭VII chord is the Mixolydian fingerprint. In G Mixolydian, that's an F major chord appearing in what would otherwise be a G major context.",
        },
        {
          heading: 'Lydian: major with a raised fourth',
          body: 'Lydian is the fourth mode — major-sounding but with a raised 4th (♯4/♯11) that gives it a dreamy, floating, almost magical quality. John Williams uses it for wonder and awe ("E.T.," "Superman"). The Simpsons theme is Lydian. It sounds familiar yet slightly otherworldly.',
          tip: "The ♯4 is the Lydian fingerprint — it creates a sense of lift and openness that regular major doesn't have. Cmaj7♯11 captures it perfectly.",
        },
        {
          heading: 'Modal mixture: borrowing across modes',
          body: "You don't need to commit to one mode for an entire song. Borrowing a characteristic chord from a parallel mode is called modal mixture. In C major, borrowing ♭VII (Bb major) from C Mixolydian gives an instant rock flavour. Borrowing iv (Fm) from C minor gives a cinematic shadow. One borrowed chord changes everything.",
          tip: 'The ♭VII chord borrowed into a major context — like Bb major appearing in a C major song — is one of the most used moves in rock and pop. "Hey Jude" does it; "Let It Be" does it.',
        },
      ],
      summary:
        'Modes are the major scale heard from different roots. Dorian (minor + raised 6th) = cool and hip. Mixolydian (major + flat 7th) = bluesy rock. Lydian (major + raised 4th) = dreamy and cinematic. Modal mixture borrows characteristic chords for instant flavour.',
      relatedChords: ['Dm7', 'G', 'Gmaj7', 'F', 'Cmaj7'],
    },
  },

  // ── Advanced ─────────────────────────────────────────────────────────────
  {
    id: 'secondary-dominants',
    skillLevel: 'advanced',
    title: 'Secondary Dominants & Borrowed Chords',
    description:
      'Make any chord feel like a destination. Borrow from parallel modes for instant chromatic colour.',
    durationMinutes: 10,
    component: 'text',
    content: {
      intro:
        'Two tools separate intermediate harmony from advanced harmony: secondary dominants (creating temporary key centres anywhere) and modal borrowing (importing chromatic chords for colour). Both explained by simple principles you already know.',
      steps: [
        {
          heading: 'Secondary dominants: V of anything',
          body: "A secondary dominant is a dominant seventh chord that resolves to a chord other than the tonic. D7 in C major doesn't belong to the key — but it resolves beautifully to G (the V chord). You're briefly tonicising G, treating it as a temporary home. Any diatonic chord can be tonicised this way.",
          tip: 'Write V7/V, V7/ii, V7/IV — "V of V," "V of ii," etc. Each creates a brief feeling of "we just arrived somewhere" before moving on.',
        },
        {
          heading: 'The tritone works for any tonicisation',
          body: 'Secondary dominants work for the same reason regular dominants do: their tritone resolves. D7 (tritone: C#–G) wants to resolve to G, because C# moves to D and G moves to F#. The ear hears this as a momentary shift to G major. This mechanism works identically for every secondary dominant.',
          tip: "Once you hear a D7 chord appearing in what should be a C major context, you'll immediately anticipate G major arriving next. The ear learns to follow the tritone.",
        },
        {
          heading: 'V7/IV: the gospel move',
          body: "In C major, the V7/IV is C7 (C–E–G–B♭). The moment you flatten the seventh of the tonic chord, you've created motion toward F. C major → C7 → F major is everywhere in gospel, soul, and R&B. Stevie Wonder, Ray Charles, Sam Cooke — this move is in their DNA.",
          tip: 'Try C major → C7 → F major in sequence. The C7 creates an almost physical pull toward F. This is V7/IV.',
        },
        {
          heading: 'Borrowed chords from parallel minor',
          body: 'Modal borrowing means importing chords from the parallel minor key. In C major, the ♭VII (B♭ major), ♭VI (A♭ major), and iv (Fm) all come from C minor. These chords introduce chromatic notes while keeping C as the tonal centre. They add shadow, weight, and unexpected beauty.',
          tip: '♭VII (Bb in C major) is the most borrowed chord in rock and pop. It feels vaguely regal or anthemic — think "Hey Jude," "With or Without You," countless others.',
        },
        {
          heading: 'The backdoor dominant',
          body: 'The "backdoor dominant" is ♭VII7 → I. In C major: B♭7 → C major. Instead of the strong G7 tritone pull, B♭7 resolves by a chromatic step down from B♭ to C. It\'s softer, jazzier, more surprising than the regular dominant. Used constantly in jazz and soul for a smooth, sideways resolution.',
          tip: 'Compare G7 → Cmaj7 with B♭7 → Cmaj7. The backdoor approach is less urgent, more sophisticated. Bill Evans and Herbie Hancock use it constantly.',
        },
      ],
      summary:
        "Secondary dominants tonicise any chord by applying V7 logic locally. Modal borrowing imports chords from the parallel minor for chromatic colour. Both are powered by the same tritone resolution mechanism — you're just applying it at different levels.",
      relatedChords: ['D7', 'G7', 'C7', 'Fmaj7', 'Bb7', 'Cmaj7'],
    },
  },
  {
    id: 'tritone-substitution',
    skillLevel: 'advanced',
    title: 'Tritone Substitution & Reharmonisation',
    description:
      'Replace any dominant with a chord a tritone away. The result: chromatic bass motion and completely unexpected harmonic colour.',
    durationMinutes: 12,
    component: 'text',
    content: {
      intro:
        'Tritone substitution is the most elegant idea in jazz harmony: any dominant seventh chord shares its defining tritone with exactly one other dominant seventh chord — the one a tritone away. Swap them and you get chromatic bass lines and unexpected colour that still resolves correctly.',
      steps: [
        {
          heading: 'The shared tritone: why it works',
          body: 'G7 contains the tritone B–F. D♭7 (a tritone from G) contains C–G♭. G♭ is enharmonically F#, which is "the same note" as F# — and resolves to G. C resolves to B. The resolution tones are identical — just swapped in role. Both chords want to go to C major, just from opposite directions.',
          tip: 'Every dominant seventh chord has exactly one tritone substitute. Find it by going exactly 6 semitones (a tritone) from the root. G → D♭. D → A♭. A → E♭. Etc.',
        },
        {
          heading: 'The tritone sub in ii–V–I',
          body: 'Standard: Dm7 → G7 → Cmaj7. With tritone sub: Dm7 → D♭7 → Cmaj7. The bass now moves D → D♭ → C — a smooth chromatic descent. This is the bebop sound. The D♭7 is shocking but resolves perfectly. Charlie Parker, Bud Powell, and Bill Evans used this constantly.',
          tip: 'The chromatic bass descent (D→D♭→C) is why tritone subs are so popular — they create elegant bass motion even without an active bass player.',
        },
        {
          heading: 'Applying to secondary dominants',
          body: 'Any dominant seventh can be tritone-substituted — not just the primary V7. V7/ii (D7 → Am7) can become A♭7 → Am7. The unexpected flat-II movement is jarring but works because of that shared tritone resolution. Jazz musicians apply this technique to create constantly surprising but logical harmonic motion.',
          tip: 'Stack tritone subs on multiple secondary dominants in a progression and you get dense chromatic movement — bebop harmonic language in action.',
        },
        {
          heading: 'Reharmonisation: beyond the tritone sub',
          body: 'Reharmonisation means replacing any chord with a different chord that still supports the melody note. The melody is sacred — the harmony is negotiable. Beyond tritone subs, you can replace chords with their relative major/minor, a parallel-minor chord, or a completely non-functional chord chosen purely for colour.',
          tip: 'The key rule of reharmonisation: the melody note must work against the new chord. If the melody is E, your new chord needs E as a chord tone or a natural extension (3rd, 7th, 9th, 11th, 13th).',
        },
        {
          heading: 'Hear it and apply it',
          body: 'Try Dm7 → D♭7 → Cmaj7 on a piano now. The D♭7 will sound strange in isolation, but in context it resolves beautifully. Then try the original Dm7 → G7 → Cmaj7 immediately after. The tritone sub version is more surprising, harmonically richer — and both land on the same resolution.',
          tip: 'In the generator, try adding a D♭7 before any Cmaj7 in your progression. Or an A♭7 before any Dm7. Your ear will quickly learn to love the chromatic approach.',
        },
      ],
      summary:
        'Tritone substitution works because the tritone interval in any dominant seventh is shared with the dominant a tritone away. The result: chromatic bass motion and harmonic surprise that still resolves correctly. Apply it to any dominant in a progression for instant sophistication.',
      relatedChords: ['Dm7', 'Db7', 'Cmaj7', 'G7'],
    },
  },
];

export const LESSONS_BY_SKILL = {
  beginner: LESSONS.filter((l) => l.skillLevel === 'beginner'),
  intermediate: LESSONS.filter((l) => l.skillLevel === 'intermediate'),
  advanced: LESSONS.filter((l) => l.skillLevel === 'advanced'),
} as const;
