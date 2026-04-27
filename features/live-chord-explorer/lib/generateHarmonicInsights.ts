import type { DetectedChord, ChordSuggestion, HarmonicInsight } from '../types';

function insightForSuggestion(
  suggestion: ChordSuggestion,
  anchor: NonNullable<DetectedChord>,
  keyCenter: string | null,
): HarmonicInsight {
  const { name, category, explanation, romanNumeral, sharedTones, confidence } = suggestion;
  const romanLabel = romanNumeral ? ` (${romanNumeral})` : '';
  const keyLabel = keyCenter ? ` in ${keyCenter}` : '';

  if (sharedTones >= 2) {
    return {
      id: `voiceLeading-${name}`,
      type: 'voiceLeading',
      title: 'Smooth Voice Leading',
      explanation: `${name} shares ${sharedTones} note${sharedTones !== 1 ? 's' : ''} with ${anchor.name} — the transition sounds effortless.`,
      shortLabel: `${sharedTones} shared`,
      relatedChords: [anchor.name, name],
      relatedNotes: [],
      confidence: Math.min(confidence + 0.05, 1),
    };
  }

  switch (category) {
    case 'diatonic':
      return {
        id: `diatonic-${name}`,
        type: 'diatonic',
        title: 'Diatonic Movement',
        explanation: `${name}${romanLabel} belongs naturally${keyLabel}. It'll sound stable and expected.`,
        shortLabel: 'in key',
        relatedChords: [name],
        relatedNotes: [],
        confidence,
      };

    case 'resolution':
      return {
        id: `resolution-${name}`,
        type: 'resolution',
        title: 'Resolution',
        explanation,
        shortLabel: 'resolves tension',
        relatedChords: [anchor.name, name],
        relatedNotes: [],
        confidence,
      };

    case 'tension':
      return {
        id: `tension-${name}`,
        type: 'dominant',
        title: 'Secondary Dominant',
        explanation,
        shortLabel: romanNumeral ?? 'secondary V',
        relatedChords: [name],
        relatedNotes: [],
        confidence,
      };

    case 'color':
      return {
        id: `borrowed-${name}`,
        type: 'borrowed',
        title: 'Modal Borrowing',
        explanation,
        shortLabel: romanNumeral ?? 'borrowed',
        relatedChords: [name],
        relatedNotes: [],
        confidence,
      };

    case 'jazzy':
      return {
        id: `jazzy-${name}`,
        type: 'tension',
        title: 'Jazz Harmony',
        explanation,
        shortLabel: romanNumeral ?? 'jazz',
        relatedChords: [name],
        relatedNotes: [],
        confidence,
      };

    default:
      return {
        id: `chord-${name}`,
        type: 'diatonic',
        title: name,
        explanation,
        shortLabel: romanNumeral ?? category,
        relatedChords: [name],
        relatedNotes: [],
        confidence,
      };
  }
}

function insightForAnchor(
  anchor: NonNullable<DetectedChord>,
  keyCenter: string | null,
): HarmonicInsight {
  const keyPhrase = keyCenter ? ` in the key of ${keyCenter}` : '';
  return {
    id: `anchor-${anchor.name}`,
    type: 'diatonic',
    title: anchor.name,
    explanation: `You're playing from ${anchor.name}${keyPhrase}. Select a suggestion to see where you can go next.`,
    shortLabel: 'anchor',
    relatedChords: [anchor.name],
    relatedNotes: anchor.pitchClasses.map(String),
    confidence: 1,
  };
}

function insightForLivePlaying(
  liveChord: NonNullable<DetectedChord>,
  keyCenter: string | null,
  matchedSuggestion: ChordSuggestion,
): HarmonicInsight {
  const roleLabel =
    matchedSuggestion.romanNumeral && keyCenter
      ? `${matchedSuggestion.romanNumeral} in ${keyCenter}`
      : (matchedSuggestion.romanNumeral ?? matchedSuggestion.category);
  return {
    id: `playing-${liveChord.name}`,
    type: 'playing',
    title: `You played ${liveChord.name}`,
    explanation: `${liveChord.name} is the ${roleLabel}. ${matchedSuggestion.explanation}`,
    shortLabel: matchedSuggestion.romanNumeral ?? matchedSuggestion.category,
    relatedChords: [liveChord.name],
    relatedNotes: [],
    confidence: matchedSuggestion.confidence,
  };
}

export function getActiveInsight(
  harmonicAnchor: DetectedChord,
  selectedSuggestion: ChordSuggestion | null,
  liveDetectedChord: DetectedChord,
  keyCenter: string | null,
  suggestions: ChordSuggestion[],
): HarmonicInsight | null {
  if (liveDetectedChord && harmonicAnchor && liveDetectedChord.name !== harmonicAnchor.name) {
    const match = suggestions.find((s) => s.name === liveDetectedChord.name);
    if (match) return insightForLivePlaying(liveDetectedChord, keyCenter, match);
  }
  if (selectedSuggestion && harmonicAnchor) {
    return insightForSuggestion(selectedSuggestion, harmonicAnchor, keyCenter);
  }
  if (harmonicAnchor) {
    return insightForAnchor(harmonicAnchor, keyCenter);
  }
  return null;
}
