import type { Adventurousness } from '../../lib/types';

export type ProgressionDiagramInstrument = 'piano' | 'guitar';
export type VoicingProfile = 'close' | 'spread' | 'rootless' | 'drop2' | 'openAdd9';

export type GeneratorFormData = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  styleReference: string;
  adventurousness: Adventurousness;
  voicingProfiles: VoicingProfile[];
  customVoicingInstructions: string;
  tempoBpm: number;
};
