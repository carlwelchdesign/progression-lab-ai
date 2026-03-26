export type Role = 'ADMIN' | 'AUDITOR';

export type AdminUser = {
  id: string;
  email: string;
  role: Role;
};

export type ProgressionOwner = {
  id: string;
  name: string | null;
  email: string;
};

export type ProgressionRow = {
  id: string;
  title: string;
  genre: string | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ProgressionOwner;
};

export type ProgressionDetail = {
  id: string;
  title: string;
  chords: unknown;
  pianoVoicings: unknown;
  feel: string | null;
  scale: string | null;
  genre: string | null;
  notes: string | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ProgressionOwner;
};
