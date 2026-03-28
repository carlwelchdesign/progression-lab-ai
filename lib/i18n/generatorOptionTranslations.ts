export const MODE_LABEL_KEY_BY_VALUE: Record<string, string> = {
  ionian: 'generator.options.mode.ionian',
  dorian: 'generator.options.mode.dorian',
  phrygian: 'generator.options.mode.phrygian',
  lydian: 'generator.options.mode.lydian',
  mixolydian: 'generator.options.mode.mixolydian',
  aeolian: 'generator.options.mode.aeolian',
  locrian: 'generator.options.mode.locrian',
  'major pentatonic': 'generator.options.mode.majorPentatonic',
  'minor pentatonic': 'generator.options.mode.minorPentatonic',
  'harmonic minor': 'generator.options.mode.harmonicMinor',
  'melodic minor': 'generator.options.mode.melodicMinor',
  blues: 'generator.options.mode.blues',
  'whole tone': 'generator.options.mode.wholeTone',
  diminished: 'generator.options.mode.diminished',
  chromatic: 'generator.options.mode.chromatic',
  custom: 'generator.options.mode.custom',
};

export const MODE_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  ionian: 'generator.optionGroups.mode.majorDiatonic',
  lydian: 'generator.optionGroups.mode.majorDiatonic',
  mixolydian: 'generator.optionGroups.mode.majorDiatonic',
  major: 'generator.optionGroups.mode.majorDiatonic',
  'major pentatonic': 'generator.optionGroups.mode.pentatonicBlues',
  dorian: 'generator.optionGroups.mode.minorModal',
  phrygian: 'generator.optionGroups.mode.minorModal',
  aeolian: 'generator.optionGroups.mode.minorModal',
  locrian: 'generator.optionGroups.mode.minorModal',
  'minor pentatonic': 'generator.optionGroups.mode.pentatonicBlues',
  blues: 'generator.optionGroups.mode.pentatonicBlues',
  'harmonic minor': 'generator.optionGroups.mode.extendedColors',
  'melodic minor': 'generator.optionGroups.mode.extendedColors',
  diminished: 'generator.optionGroups.mode.symmetricAdvanced',
  'whole tone': 'generator.optionGroups.mode.symmetricAdvanced',
  chromatic: 'generator.optionGroups.mode.symmetricAdvanced',
};

export const GENRE_LABEL_KEY_BY_VALUE: Record<string, string> = {
  house: 'generator.options.genre.house',
  'piano house': 'generator.options.genre.pianoHouse',
  'deep house': 'generator.options.genre.deepHouse',
  'disco house': 'generator.options.genre.discoHouse',
  'tech house': 'generator.options.genre.techHouse',
  'funk / disco': 'generator.options.genre.funkDisco',
  pop: 'generator.options.genre.pop',
  'indie pop': 'generator.options.genre.indiePop',
  'r&b / neo soul': 'generator.options.genre.rnbNeoSoul',
  jazz: 'generator.options.genre.jazz',
  'lo-fi': 'generator.options.genre.loFi',
  ambient: 'generator.options.genre.ambient',
  cinematic: 'generator.options.genre.cinematic',
  edm: 'generator.options.genre.edm',
  'afro house': 'generator.options.genre.afroHouse',
  'progressive house': 'generator.options.genre.progressiveHouse',
  'hip-hop': 'generator.options.genre.hipHop',
  rock: 'generator.options.genre.rock',
  folk: 'generator.options.genre.folk',
  custom: 'generator.options.genre.custom',
};

export const GENRE_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  house: 'generator.optionGroups.genre.danceClub',
  'piano house': 'generator.optionGroups.genre.danceClub',
  'deep house': 'generator.optionGroups.genre.danceClub',
  'disco house': 'generator.optionGroups.genre.danceClub',
  'tech house': 'generator.optionGroups.genre.danceClub',
  edm: 'generator.optionGroups.genre.danceClub',
  'afro house': 'generator.optionGroups.genre.danceClub',
  'progressive house': 'generator.optionGroups.genre.danceClub',
  pop: 'generator.optionGroups.genre.popSongwriter',
  'indie pop': 'generator.optionGroups.genre.popSongwriter',
  'hip-hop': 'generator.optionGroups.genre.urbanGroove',
  'r&b / neo soul': 'generator.optionGroups.genre.urbanGroove',
  jazz: 'generator.optionGroups.genre.jazzHarmony',
  'funk / disco': 'generator.optionGroups.genre.jazzHarmony',
  ambient: 'generator.optionGroups.genre.atmosphericCinematic',
  cinematic: 'generator.optionGroups.genre.atmosphericCinematic',
  'lo-fi': 'generator.optionGroups.genre.atmosphericCinematic',
  rock: 'generator.optionGroups.genre.bandAcoustic',
  folk: 'generator.optionGroups.genre.bandAcoustic',
};

export const ADVENTUROUSNESS_LABEL_KEY_BY_VALUE: Record<string, string> = {
  safe: 'generator.options.adventurousness.safe',
  balanced: 'generator.options.adventurousness.balanced',
  surprising: 'generator.options.adventurousness.surprising',
};

export const ADVENTUROUSNESS_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  safe: 'generator.optionGroups.adventurousness.riskProfile',
  balanced: 'generator.optionGroups.adventurousness.riskProfile',
  surprising: 'generator.optionGroups.adventurousness.riskProfile',
};

export const STYLE_REFERENCE_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  'Jazz Piano Icons': 'generator.styleReferenceGroups.jazzPianoIcons',
  'Modern Harmony Voices': 'generator.styleReferenceGroups.modernHarmonyVoices',
  'Educators and Methods': 'generator.styleReferenceGroups.educatorsAndMethods',
};
