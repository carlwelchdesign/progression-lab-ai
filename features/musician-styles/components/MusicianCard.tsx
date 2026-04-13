import type { MusicianProfileSummary } from '../types';

type MusicianCardProps = {
  musician: MusicianProfileSummary;
  onSelect: (slug: string) => void;
};

export function MusicianCard({ musician, onSelect }: MusicianCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(musician.slug)}
      className="rounded border p-4 text-left hover:bg-gray-50"
    >
      <h3 className="font-semibold">{musician.displayName}</h3>
      <p className="text-sm text-gray-600">{musician.genre}</p>
      <p className="text-sm text-gray-500">{musician.tagline}</p>
    </button>
  );
}
