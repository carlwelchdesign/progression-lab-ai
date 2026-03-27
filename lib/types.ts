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
    styleReference: string | null;
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

export type SavedGeneratorFormData = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  styleReference: string;
  adventurousness: Adventurousness;
  tempoBpm: number;
};

export type GeneratorSnapshot = {
  formData: SavedGeneratorFormData;
  data: ChordSuggestionResponse;
};

// Progression database types
export type ChordItem = {
  name: string;
  beats: number;
};

export type ProgressionPayload = {
  title?: string;
  chords?: ChordItem[];
  pianoVoicings?: PianoVoicing[];
  feel?: string;
  scale?: string;
  genre?: string;
  notes?: string;
  tags?: string[];
  isPublic?: boolean;
  generatorSnapshot?: GeneratorSnapshot;
};

export type CreateProgressionRequest = ProgressionPayload;
export type UpdateProgressionRequest = Partial<ProgressionPayload>;

export type Progression = {
  id: string;
  shareId: string;
  userId: string;
  title: string;
  chords: ChordItem[];
  pianoVoicings?: PianoVoicing[];
  feel?: string;
  scale?: string;
  genre?: string;
  notes?: string;
  tags: string[];
  isPublic: boolean;
  generatorSnapshot?: GeneratorSnapshot;
  createdAt: Date;
  updatedAt: Date;
};

export type ArrangementEvent = {
  padKey: string;
  chord: string;
  source: string;
  leftHand: string[];
  rightHand: string[];
  stepIndex: number;
  velocity?: number;
};

export type ArrangementTimeline = {
  stepsPerBar: number;
  loopLengthBars: number;
  totalSteps: number;
  events: ArrangementEvent[];
};

export type ArrangementPlaybackSnapshot = {
  tempoBpm: number;
  timeSignature: '4/4' | '3/4' | '6/8';
  padPattern: 'single' | 'quarter-pulse' | 'eighth-pulse' | 'offbeat-stab' | 'syncopated-stab';
  playbackStyle: 'block' | 'strum';
  instrument: 'piano' | 'rhodes';
  octaveShift: number;
  attack: number;
  decay: number;
  padVelocity: number;
  humanize: number;
  gate: number;
  inversionRegister: 'off' | 'low' | 'mid' | 'high';
};

export type ArrangementPayload = {
  title?: string;
  timeline: ArrangementTimeline;
  playbackSnapshot: ArrangementPlaybackSnapshot;
  sourceChords?: Array<{
    key: string;
    chord: string;
    source: string;
    leftHand: string[];
    rightHand: string[];
  }>;
  notes?: string;
  tags?: string[];
  isPublic?: boolean;
};

export type CreateArrangementRequest = ArrangementPayload;
export type UpdateArrangementRequest = Partial<ArrangementPayload>;

export type Arrangement = {
  id: string;
  shareId: string;
  userId: string;
  title: string;
  timeline: ArrangementTimeline;
  playbackSnapshot: ArrangementPlaybackSnapshot;
  sourceChords?: Array<{
    key: string;
    chord: string;
    source: string;
    leftHand: string[];
    rightHand: string[];
  }>;
  notes?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};
