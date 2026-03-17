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
