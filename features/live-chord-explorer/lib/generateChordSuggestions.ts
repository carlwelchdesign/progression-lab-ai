import { SHARP_NOTE_NAMES, NOTE_NAME_TO_SEMITONE } from '../../../domain/music/musicNoteConstants';
import { createPianoVoicingFromChordSymbol } from '../../../domain/music/chordVoicing';
import { getCircleOfFifthsNeighborSemitones } from '../../../domain/music/circleOfFifths';
import {
  MAJOR_SCALE_INTERVALS,
  DIATONIC_CHORD_QUALITIES,
  ROMAN_NUMERALS_MAJOR,
} from './chordTemplates';
import { getCompatibleScales } from './scaleCompatibility';
import type {
  DetectedChord,
  ChordSuggestion,
  SuggestionCategory,
  MoodTag,
  PianoVoicing,
} from '../types';

const CHORD_ROOT_PATTERN = /^([A-G](?:#|b)?)/;

function getRootPC(chordName: string): number | null {
  const match = chordName.match(CHORD_ROOT_PATTERN);
  if (!match) return null;
  return NOTE_NAME_TO_SEMITONE[match[1]] ?? null;
}

function buildVoicing(chordName: string): PianoVoicing {
  return (
    createPianoVoicingFromChordSymbol(chordName) ?? {
      leftHand: [],
      rightHand: [],
    }
  );
}

function countSharedTones(pitchClasses: number[], chordName: string): number {
  const voicing = createPianoVoicingFromChordSymbol(chordName);
  if (!voicing) return 0;

  const targetPCs = new Set(
    [...voicing.leftHand, ...voicing.rightHand].map((n) => {
      const match = n.match(CHORD_ROOT_PATTERN);
      if (!match) return -1;
      return NOTE_NAME_TO_SEMITONE[match[1]] ?? -1;
    }),
  );

  return pitchClasses.filter((pc) => targetPCs.has(((pc % 12) + 12) % 12)).length;
}

function makeSuggestion(
  name: string,
  romanNumeral: string | null,
  category: SuggestionCategory,
  explanation: string,
  mood: MoodTag,
  confidence: number,
  currentPCs: number[],
): ChordSuggestion {
  return {
    name,
    romanNumeral,
    category,
    explanation,
    pianoVoicing: buildVoicing(name),
    scales: getCompatibleScales(name.replace(CHORD_ROOT_PATTERN, '') || 'maj'),
    mood,
    confidence,
    sharedTones: countSharedTones(currentPCs, name),
  };
}

function diatonicSuggestions(root: number, currentPCs: number[]): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];

  MAJOR_SCALE_INTERVALS.forEach((interval, degree) => {
    const chordRoot = (root + interval) % 12;
    const rootName = SHARP_NOTE_NAMES[chordRoot];
    const template = DIATONIC_CHORD_QUALITIES[degree];
    const chordName = `${rootName}${template.suffix}`;
    const roman = ROMAN_NUMERALS_MAJOR[degree];

    suggestions.push(
      makeSuggestion(
        chordName,
        roman,
        'diatonic',
        `Diatonic ${roman} chord — naturally fits the key.`,
        degree === 0 ? 'stable' : degree === 3 ? 'bright' : degree === 5 ? 'dreamy' : 'stable',
        0.9,
        currentPCs,
      ),
    );
  });

  return suggestions;
}

function resolutionSuggestions(currentRoot: number, currentPCs: number[]): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];
  const neighbors = getCircleOfFifthsNeighborSemitones(currentRoot);

  for (const pc of neighbors) {
    const rootName = SHARP_NOTE_NAMES[pc];

    // Dominant → tonic resolution: V7 resolves to I
    const dom7Name = `${SHARP_NOTE_NAMES[currentRoot]}7`;
    suggestions.push(
      makeSuggestion(
        `${rootName}maj7`,
        'I',
        'resolution',
        `${dom7Name} → ${rootName}maj7: classic dominant-to-tonic resolution.`,
        'resolved',
        0.95,
        currentPCs,
      ),
    );

    // IV → I plagal cadence
    const ivRoot = (pc + 5) % 12;
    const ivName = `${SHARP_NOTE_NAMES[ivRoot]}maj7`;
    suggestions.push(
      makeSuggestion(
        ivName,
        'IV',
        'resolution',
        `Plagal (IV→I) movement — gentle, hymn-like resolution.`,
        'resolved',
        0.8,
        currentPCs,
      ),
    );
  }

  return suggestions;
}

function tensionSuggestions(currentRoot: number, currentPCs: number[]): ChordSuggestion[] {
  // Secondary dominants: V7/ii, V7/IV, V7/vi
  const secondaryTargets = [
    { targetInterval: 2, label: 'ii', roman: 'V7/ii' },
    { targetInterval: 5, label: 'IV', roman: 'V7/IV' },
    { targetInterval: 9, label: 'vi', roman: 'V7/vi' },
  ];

  return secondaryTargets.map(({ targetInterval, label, roman }) => {
    const targetRoot = (currentRoot + targetInterval) % 12;
    const dominantRoot = (targetRoot + 7) % 12; // V of target = +7 semitones from target root
    const chordName = `${SHARP_NOTE_NAMES[dominantRoot]}7`;

    return makeSuggestion(
      chordName,
      roman,
      'tension',
      `Secondary dominant — creates tension pulling toward ${label}.`,
      'tense',
      0.75,
      currentPCs,
    );
  });
}

function colorSuggestions(currentRoot: number, currentPCs: number[]): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];

  // bVII — major chord one whole step below tonic
  const bVIIRoot = (currentRoot + 10) % 12;
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[bVIIRoot]}`,
      'bVII',
      'color',
      'Borrowed bVII from parallel minor — adds cinematic weight.',
      'cinematic',
      0.7,
      currentPCs,
    ),
  );

  // bVI — borrowed from parallel minor
  const bVIRoot = (currentRoot + 8) % 12;
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[bVIRoot]}`,
      'bVI',
      'color',
      'Borrowed bVI — dreamy, lush color from parallel minor.',
      'dreamy',
      0.7,
      currentPCs,
    ),
  );

  // iv — minor subdominant borrowed from parallel minor
  const ivRoot = (currentRoot + 5) % 12;
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[ivRoot]}m`,
      'iv',
      'color',
      'Minor IV borrowed from parallel minor — dark, expressive colour.',
      'dark',
      0.72,
      currentPCs,
    ),
  );

  // bIII
  const bIIIRoot = (currentRoot + 3) % 12;
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[bIIIRoot]}`,
      'bIII',
      'color',
      'Borrowed bIII — adds brightness and modal ambiguity.',
      'bright',
      0.65,
      currentPCs,
    ),
  );

  return suggestions;
}

function jazzySuggestions(currentRoot: number, currentPCs: number[]): ChordSuggestion[] {
  const suggestions: ChordSuggestion[] = [];

  // ii-V-I: the ii chord
  const iiRoot = (currentRoot + 2) % 12;
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[iiRoot]}m7`,
      'ii',
      'jazzy',
      'Start of a ii-V-I — the classic jazz cadence.',
      'jazzy',
      0.85,
      currentPCs,
    ),
  );

  // ii-V-I: V7
  const vRoot = (currentRoot + 7) % 12;
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[vRoot]}7`,
      'V7',
      'jazzy',
      'Dominant 7th in a ii-V-I — strong pull toward tonic.',
      'tense',
      0.85,
      currentPCs,
    ),
  );

  // Tritone substitution: chord a tritone away from V
  const tritoneRoot = (currentRoot + 6) % 12;
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[tritoneRoot]}7`,
      'bII7',
      'jazzy',
      'Tritone substitution — replaces V7 with chromatic voice leading.',
      'jazzy',
      0.7,
      currentPCs,
    ),
  );

  // Imaj7 with extensions
  suggestions.push(
    makeSuggestion(
      `${SHARP_NOTE_NAMES[currentRoot]}maj7`,
      'Imaj7',
      'jazzy',
      'Tonic major 7th — open, luminous jazz resolution.',
      'dreamy',
      0.8,
      currentPCs,
    ),
  );

  return suggestions;
}

/**
 * Generates ranked chord suggestions for the given detected chord and optional key center.
 * Groups suggestions by harmonic category.
 */
export function generateChordSuggestions(
  currentChord: DetectedChord,
  keyCenter: string | null,
): ChordSuggestion[] {
  if (!currentChord) return [];

  const currentRoot = getRootPC(currentChord.root);
  if (currentRoot === null) return [];

  const pivotRoot = keyCenter ? (NOTE_NAME_TO_SEMITONE[keyCenter] ?? currentRoot) : currentRoot;

  const suggestions: ChordSuggestion[] = [
    ...diatonicSuggestions(pivotRoot, currentChord.pitchClasses),
    ...resolutionSuggestions(currentRoot, currentChord.pitchClasses),
    ...tensionSuggestions(pivotRoot, currentChord.pitchClasses),
    ...colorSuggestions(pivotRoot, currentChord.pitchClasses),
    ...jazzySuggestions(currentRoot, currentChord.pitchClasses),
  ];

  // Remove the current chord from suggestions
  return suggestions.filter((s) => s.name !== currentChord.name);
}
