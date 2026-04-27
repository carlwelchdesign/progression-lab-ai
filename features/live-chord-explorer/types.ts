import type { PianoVoicing } from '../../lib/types';

export type { PianoVoicing };

export type MidiConnectionStatus = 'connecting' | 'connected' | 'unavailable' | 'denied';

export type ActiveNote = {
  midiNumber: number;
  noteNameWithOctave: string;
  pitchClass: number;
};

export type DetectedChord = {
  name: string;
  root: string;
  quality: string;
  pitchClasses: number[];
  alternateInterpretations: string[];
  bassNote?: string;
} | null;

export type SuggestionCategory = 'diatonic' | 'tension' | 'resolution' | 'color' | 'jazzy';

export type MoodTag =
  | 'stable'
  | 'bright'
  | 'dark'
  | 'tense'
  | 'resolved'
  | 'dreamy'
  | 'cinematic'
  | 'jazzy';

export type ChordSuggestion = {
  name: string;
  romanNumeral: string | null;
  category: SuggestionCategory;
  explanation: string;
  pianoVoicing: PianoVoicing;
  scales: string[];
  mood: MoodTag;
  confidence: number;
  sharedTones: number;
};

export type HarmonicInsightType =
  | 'diatonic'
  | 'dominant'
  | 'resolution'
  | 'borrowed'
  | 'voiceLeading'
  | 'tension'
  | 'playing';

export type HarmonicInsight = {
  id: string;
  type: HarmonicInsightType;
  title: string;
  explanation: string;
  shortLabel: string;
  relatedChords: string[];
  relatedNotes: string[];
  confidence: number;
};
