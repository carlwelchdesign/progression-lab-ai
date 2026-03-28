export const MODE_LABEL_KEY_BY_VALUE: Record<string, string> = {
  ionian: 'options.mode.ionian',
  dorian: 'options.mode.dorian',
  phrygian: 'options.mode.phrygian',
  lydian: 'options.mode.lydian',
  mixolydian: 'options.mode.mixolydian',
  aeolian: 'options.mode.aeolian',
  locrian: 'options.mode.locrian',
  'major pentatonic': 'options.mode.majorPentatonic',
  'minor pentatonic': 'options.mode.minorPentatonic',
  'harmonic minor': 'options.mode.harmonicMinor',
  'melodic minor': 'options.mode.melodicMinor',
  blues: 'options.mode.blues',
  'whole tone': 'options.mode.wholeTone',
  diminished: 'options.mode.diminished',
  chromatic: 'options.mode.chromatic',
  custom: 'options.mode.custom',
};

export const MODE_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  ionian: 'optionGroups.mode.majorDiatonic',
  lydian: 'optionGroups.mode.majorDiatonic',
  mixolydian: 'optionGroups.mode.majorDiatonic',
  major: 'optionGroups.mode.majorDiatonic',
  'major pentatonic': 'optionGroups.mode.pentatonicBlues',
  dorian: 'optionGroups.mode.minorModal',
  phrygian: 'optionGroups.mode.minorModal',
  aeolian: 'optionGroups.mode.minorModal',
  locrian: 'optionGroups.mode.minorModal',
  'minor pentatonic': 'optionGroups.mode.pentatonicBlues',
  blues: 'optionGroups.mode.pentatonicBlues',
  'harmonic minor': 'optionGroups.mode.extendedColors',
  'melodic minor': 'optionGroups.mode.extendedColors',
  diminished: 'optionGroups.mode.symmetricAdvanced',
  'whole tone': 'optionGroups.mode.symmetricAdvanced',
  chromatic: 'optionGroups.mode.symmetricAdvanced',
};

export const GENRE_LABEL_KEY_BY_VALUE: Record<string, string> = {
  house: 'options.genre.house',
  'piano house': 'options.genre.pianoHouse',
  'deep house': 'options.genre.deepHouse',
  'disco house': 'options.genre.discoHouse',
  'tech house': 'options.genre.techHouse',
  'funk / disco': 'options.genre.funkDisco',
  pop: 'options.genre.pop',
  'indie pop': 'options.genre.indiePop',
  'r&b / neo soul': 'options.genre.rnbNeoSoul',
  jazz: 'options.genre.jazz',
  'lo-fi': 'options.genre.loFi',
  ambient: 'options.genre.ambient',
  cinematic: 'options.genre.cinematic',
  edm: 'options.genre.edm',
  'afro house': 'options.genre.afroHouse',
  'progressive house': 'options.genre.progressiveHouse',
  'hip-hop': 'options.genre.hipHop',
  rock: 'options.genre.rock',
  folk: 'options.genre.folk',
  custom: 'options.genre.custom',
};

export const GENRE_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  house: 'optionGroups.genre.danceClub',
  'piano house': 'optionGroups.genre.danceClub',
  'deep house': 'optionGroups.genre.danceClub',
  'disco house': 'optionGroups.genre.danceClub',
  'tech house': 'optionGroups.genre.danceClub',
  edm: 'optionGroups.genre.danceClub',
  'afro house': 'optionGroups.genre.danceClub',
  'progressive house': 'optionGroups.genre.danceClub',
  pop: 'optionGroups.genre.popSongwriter',
  'indie pop': 'optionGroups.genre.popSongwriter',
  'hip-hop': 'optionGroups.genre.urbanGroove',
  'r&b / neo soul': 'optionGroups.genre.urbanGroove',
  jazz: 'optionGroups.genre.jazzHarmony',
  'funk / disco': 'optionGroups.genre.jazzHarmony',
  ambient: 'optionGroups.genre.atmosphericCinematic',
  cinematic: 'optionGroups.genre.atmosphericCinematic',
  'lo-fi': 'optionGroups.genre.atmosphericCinematic',
  rock: 'optionGroups.genre.bandAcoustic',
  folk: 'optionGroups.genre.bandAcoustic',
};

export const ADVENTUROUSNESS_LABEL_KEY_BY_VALUE: Record<string, string> = {
  safe: 'options.adventurousness.safe',
  balanced: 'options.adventurousness.balanced',
  surprising: 'options.adventurousness.surprising',
};

export const ADVENTUROUSNESS_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  safe: 'optionGroups.adventurousness.riskProfile',
  balanced: 'optionGroups.adventurousness.riskProfile',
  surprising: 'optionGroups.adventurousness.riskProfile',
};

export const STYLE_REFERENCE_CATEGORY_KEY_BY_VALUE: Record<string, string> = {
  'Jazz Piano Icons': 'styleReferenceGroups.jazzPianoIcons',
  'Modern Harmony Voices': 'styleReferenceGroups.modernHarmonyVoices',
  'Educators and Methods': 'styleReferenceGroups.educatorsAndMethods',
};
