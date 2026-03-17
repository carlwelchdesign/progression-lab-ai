export type InstrumentPreference = 'guitar' | 'piano' | 'both';
export type Adventurousness = 'safe' | 'balanced' | 'surprising';

export type PianoVoicing = {
  leftHand: string[];
  rightHand: string[];
};

export type GuitarVoicing = {
  title: string;
  position: number | null;
  fingers: Array<{
    string: number;
    fret: number | 'x';
    finger: string | null;
  }>;
  barres: Array<{
    fromString: number;
    toString: number;
    fret: number;
    text: string | null;
  }>;
};

export type NextChordSuggestion = {
  chord: string;
  romanNumeral: string | null;
  functionExplanation: string;
  tensionLevel: number;
  confidence: number;
  voicingHint: string | null;
  pianoVoicing: PianoVoicing | null;
  guitarVoicing: GuitarVoicing | null;
};

export type ProgressionIdea = {
  label: string;
  chords: string[];
  feel: string;
  performanceTip: string | null;
  pianoVoicings: PianoVoicing[];
};

export type ChordSuggestionResponse = {
  inputSummary: {
    seedChords: string[];
    mood: string | null;
    mode: string | null;
    genre: string | null;
    instrument: InstrumentPreference | null;
    adventurousness: Adventurousness | null;
  };
  nextChordSuggestions: NextChordSuggestion[];
  progressionIdeas: ProgressionIdea[];
  structureSuggestions: Array<{
    section: 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro';
    bars: number;
    harmonicIdea: string;
  }>;
};

// Progression database types
export type ChordItem = {
  name: string;
  beats: number;
};

export type ProgressionPayload = {
  title: string;
  chords: ChordItem[];
  feel?: string;
  scale?: string;
  notes?: string;
  tags?: string[];
  isPublic?: boolean;
};

export type CreateProgressionRequest = ProgressionPayload;
export type UpdateProgressionRequest = Partial<ProgressionPayload>;

export type Progression = {
  id: string;
  shareId: string;
  userId: string;
  title: string;
  chords: ChordItem[];
  feel?: string;
  scale?: string;
  notes?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};