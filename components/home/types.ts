import type { Adventurousness } from '../../lib/types';

export type ProgressionDiagramInstrument = 'piano' | 'guitar';

export type GeneratorFormData = {
  seedChords: string;
  mood: string;
  mode: string;
  customMode: string;
  genre: string;
  customGenre: string;
  adventurousness: Adventurousness;
};
