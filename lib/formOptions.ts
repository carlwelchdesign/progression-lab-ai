/**
 * Mode/scale choices for generator form.
 */
export const MODE_OPTIONS = [
  { value: 'ionian', label: 'Ionian (Major)' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'aeolian', label: 'Aeolian (Natural Minor)' },
  { value: 'locrian', label: 'Locrian' },
  { value: 'major pentatonic', label: 'Major Pentatonic' },
  { value: 'minor pentatonic', label: 'Minor Pentatonic' },
  { value: 'harmonic minor', label: 'Harmonic Minor' },
  { value: 'melodic minor', label: 'Melodic Minor' },
  { value: 'blues', label: 'Blues' },
  { value: 'whole tone', label: 'Whole Tone' },
  { value: 'diminished', label: 'Diminished' },
  { value: 'chromatic', label: 'Chromatic' },
  { value: 'custom', label: 'Custom' },
];

export const MODE_INPUT_OPTIONS = MODE_OPTIONS.filter((option) => option.value !== 'custom').map(
  (option) => option.value,
);

export const MODE_CATEGORY_BY_NAME: Record<string, string> = {
  ionian: 'Major / Diatonic',
  lydian: 'Major / Diatonic',
  mixolydian: 'Major / Diatonic',
  major: 'Major / Diatonic',
  'major pentatonic': 'Pentatonic / Blues',
  dorian: 'Minor / Modal',
  phrygian: 'Minor / Modal',
  aeolian: 'Minor / Modal',
  locrian: 'Minor / Modal',
  'minor pentatonic': 'Pentatonic / Blues',
  blues: 'Pentatonic / Blues',
  'harmonic minor': 'Extended Colors',
  'melodic minor': 'Extended Colors',
  diminished: 'Symmetric / Advanced',
  'whole tone': 'Symmetric / Advanced',
  chromatic: 'Symmetric / Advanced',
};

/**
 * Genre presets for generator form.
 */
export const GENRE_OPTIONS = [
  { value: 'house', label: 'House' },
  { value: 'piano house', label: 'Piano House' },
  { value: 'deep house', label: 'Deep House' },
  { value: 'disco house', label: 'Disco House' },
  { value: 'tech house', label: 'Tech House' },
  { value: 'funk / disco', label: 'Funk / Disco' },
  { value: 'pop', label: 'Pop' },
  { value: 'indie pop', label: 'Indie Pop' },
  { value: 'r&b / neo soul', label: 'R&B / Neo Soul' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'lo-fi', label: 'Lo-fi' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'edm', label: 'EDM' },
  { value: 'afro house', label: 'Afro House' },
  { value: 'progressive house', label: 'Progressive House' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'rock', label: 'Rock' },
  { value: 'folk', label: 'Folk' },
  { value: 'custom', label: 'Custom' },
];

export const GENRE_INPUT_OPTIONS = GENRE_OPTIONS.filter((option) => option.value !== 'custom').map(
  (option) => option.value,
);

export const GENRE_CATEGORY_BY_NAME: Record<string, string> = {
  house: 'Dance / Club',
  'piano house': 'Dance / Club',
  'deep house': 'Dance / Club',
  'disco house': 'Dance / Club',
  'tech house': 'Dance / Club',
  edm: 'Dance / Club',
  'afro house': 'Dance / Club',
  'progressive house': 'Dance / Club',
  pop: 'Pop / Songwriter',
  'indie pop': 'Pop / Songwriter',
  'hip-hop': 'Urban / Groove',
  'r&b / neo soul': 'Urban / Groove',
  jazz: 'Jazz / Harmony',
  'funk / disco': 'Jazz / Harmony',
  ambient: 'Atmospheric / Cinematic',
  cinematic: 'Atmospheric / Cinematic',
  'lo-fi': 'Atmospheric / Cinematic',
  rock: 'Band / Acoustic',
  folk: 'Band / Acoustic',
};

export const ADVENTUROUSNESS_OPTIONS = ['safe', 'balanced', 'surprising'] as const;

export const ADVENTUROUSNESS_CATEGORY_BY_NAME: Record<string, string> = {
  safe: 'Risk Profile',
  balanced: 'Risk Profile',
  surprising: 'Risk Profile',
};

/**
 * Seed chord presets used by randomizer and suggestions.
 */
export const CHORD_OPTIONS = [
  // Major chords
  'C',
  'D',
  'E',
  'F',
  'G',
  'A',
  'B',
  // Minor chords
  'Cm',
  'Dm',
  'Em',
  'Fm',
  'Gm',
  'Am',
  'Bm',
  // Seventh chords
  'C7',
  'D7',
  'E7',
  'F7',
  'G7',
  'A7',
  'B7',
  // Major seventh
  'Cmaj7',
  'Dmaj7',
  'Emaj7',
  'Fmaj7',
  'Gmaj7',
  'Amaj7',
  'Bmaj7',
  // Minor seventh
  'Cm7',
  'Dm7',
  'Em7',
  'Fm7',
  'Gm7',
  'Am7',
  'Bm7',
  // Other common extensions
  'Cadd9',
  'Dadd9',
  'Eadd9',
  'Fadd9',
  'Gadd9',
  'Aadd9',
  'Badd9',
  'Csus2',
  'Dsus2',
  'Esus2',
  'Fsus2',
  'Gsus2',
  'Asus2',
  'Bsus2',
  'Csus4',
  'Dsus4',
  'Esus4',
  'Fsus4',
  'Gsus4',
  'Asus4',
  'Bsus4',
  // Sharp chords
  'C#',
  'D#',
  'F#',
  'G#',
  'A#',
  'C#m',
  'D#m',
  'F#m',
  'G#m',
  'A#m',
  'C#maj7',
  'D#maj7',
  'F#maj7',
  'G#maj7',
  'A#maj7',
  'C#7',
  'D#7',
  'F#7',
  'G#7',
  'A#7',
  'C#m7',
  'D#m7',
  'F#m7',
  'G#m7',
  'A#m7',
  // Flat chords
  'Db',
  'Eb',
  'Gb',
  'Ab',
  'Bb',
  'Dbm',
  'Ebm',
  'Gbm',
  'Abm',
  'Bbm',
  'Dbmaj7',
  'Ebmaj7',
  'Gbmaj7',
  'Abmaj7',
  'Bbmaj7',
  'Db7',
  'Eb7',
  'Gb7',
  'Ab7',
  'Bb7',
  'Dbm7',
  'Ebm7',
  'Gbm7',
  'Abm7',
  'Bbm7',
];

/**
 * Mood descriptors used for prompt shaping.
 */
export const MOOD_OPTIONS = [
  'Dreamy',
  'Dark',
  'Hopeful',
  'Energetic',
  'Melancholic',
  'Happy',
  'Sad',
  'Angry',
  'Calm',
  'Uplifting',
  'Emotional',
  'Peaceful',
  'Intense',
  'Mellow',
  'Bright',
  'Moody',
  'Somber',
  'Playful',
  'Dramatic',
  'Romantic',
  'Mysterious',
  'Ethereal',
  'Groovy',
  'Chill',
  'Epic',
  'Whimsical',
  'Nostalgic',
  'Vibrant',
  'Soulful',
  'Ambient',
  'Hypnotic',
  'Euphoric',
  'Anxious',
  'Triumphant',
  'Introspective',
  'Funky',
  'Dark ambient',
  'Cinematic',
];

/**
 * Optional style references used to shape harmonic language.
 */
type StyleReferenceCategory =
  | 'Jazz Piano Icons'
  | 'Modern Harmony Voices'
  | 'Educators and Methods';

const STYLE_REFERENCE_SUGGESTIONS: Array<{
  name: string;
  category: StyleReferenceCategory;
}> = [
  { name: 'Barry Harris', category: 'Jazz Piano Icons' },
  { name: 'Bill Evans', category: 'Jazz Piano Icons' },
  { name: 'Herbie Hancock', category: 'Jazz Piano Icons' },
  { name: 'McCoy Tyner', category: 'Jazz Piano Icons' },
  { name: 'Chick Corea', category: 'Jazz Piano Icons' },
  { name: 'Red Garland', category: 'Jazz Piano Icons' },
  { name: 'Thelonious Monk', category: 'Jazz Piano Icons' },
  { name: 'Oscar Peterson', category: 'Jazz Piano Icons' },
  { name: 'Bud Powell', category: 'Jazz Piano Icons' },
  { name: 'Kenny Barron', category: 'Jazz Piano Icons' },
  { name: 'Mulgrew Miller', category: 'Jazz Piano Icons' },
  { name: 'Wynton Kelly', category: 'Jazz Piano Icons' },
  { name: 'Cory Henry', category: 'Modern Harmony Voices' },
  { name: 'Robert Glasper', category: 'Modern Harmony Voices' },
  { name: 'Jacob Collier', category: 'Modern Harmony Voices' },
  { name: 'Bernie Worrell', category: 'Modern Harmony Voices' },
  { name: 'Junie Morrison', category: 'Modern Harmony Voices' },
  { name: 'Pharrell Williams', category: 'Modern Harmony Voices' },
  { name: 'Stevie Wonder', category: 'Modern Harmony Voices' },
  { name: 'Elton John', category: 'Modern Harmony Voices' },
  { name: 'Billy Joel', category: 'Modern Harmony Voices' },
  { name: 'Paul McCartney', category: 'Modern Harmony Voices' },
  { name: 'Quincy Jones', category: 'Modern Harmony Voices' },
  { name: 'Nadia Boulanger', category: 'Educators and Methods' },
  { name: 'Berklee Harmony Method', category: 'Educators and Methods' },
  { name: 'Gospel Harmony Language', category: 'Educators and Methods' },
];

const STYLE_REFERENCE_CATEGORY_ORDER: Record<StyleReferenceCategory, number> = {
  'Jazz Piano Icons': 0,
  'Modern Harmony Voices': 1,
  'Educators and Methods': 2,
};

export const STYLE_REFERENCE_OPTIONS = [...STYLE_REFERENCE_SUGGESTIONS]
  .sort((left, right) => {
    const categoryOrderDiff =
      STYLE_REFERENCE_CATEGORY_ORDER[left.category] -
      STYLE_REFERENCE_CATEGORY_ORDER[right.category];

    if (categoryOrderDiff !== 0) {
      return categoryOrderDiff;
    }

    return left.name.localeCompare(right.name);
  })
  .map((option) => option.name);

export const STYLE_REFERENCE_CATEGORY_BY_NAME: Record<string, StyleReferenceCategory> =
  STYLE_REFERENCE_SUGGESTIONS.reduce<Record<string, StyleReferenceCategory>>((acc, option) => {
    acc[option.name] = option.category;
    return acc;
  }, {});
