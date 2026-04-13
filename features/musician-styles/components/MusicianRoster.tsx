'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MusicianCard } from './MusicianCard';
import type { MusicianProfileSummary } from '../types';

type GenreGroup = {
  label: string;
  musicians: MusicianProfileSummary[];
};

type MusicianRosterProps = {
  genres: GenreGroup[];
};

export function MusicianRoster({ genres }: MusicianRosterProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const allMusicians = useMemo(() => genres.flatMap((group) => group.musicians), [genres]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) {
      return [];
    }

    return allMusicians.filter((musician) =>
      [musician.displayName, ...musician.exampleSongs].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [allMusicians, query]);

  return (
    <section className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="musician-search">
          Search pianist
        </label>
        <input
          id="musician-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a pianist name"
          aria-label="Search for a pianist"
          autoComplete="off"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {genres.length === 0 ? (
        <div className="rounded border p-4 text-sm text-gray-700">
          <p className="font-medium">No seeded legends available yet.</p>
          <p className="mt-1">
            Type any pianist name above (for example, &quot;Stevie Wonder&quot;) and use the
            generate button to create lessons.
          </p>
        </div>
      ) : null}

      {query.trim().length >= 2 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((musician) => (
            <MusicianCard
              key={musician.id}
              musician={musician}
              onSelect={(slug) => router.push(`/styles/${slug}`)}
            />
          ))}
          {filtered.length === 0 ? (
            <div className="space-y-2 rounded border p-3">
              <p className="text-sm text-gray-600">No exact match found.</p>
              <button
                type="button"
                aria-label={`Generate lessons for ${query.trim()}`}
                disabled={isRequesting}
                onClick={async () => {
                  setIsRequesting(true);
                  setRequestError(null);
                  try {
                    const response = await fetch('/api/musician-styles/request', {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: query.trim() }),
                    });

                    const data = (await response.json()) as { slug?: string; message?: string };
                    if (!response.ok || !data.slug) {
                      throw new Error(data.message ?? 'Could not create custom musician profile');
                    }

                    router.push(`/styles/${data.slug}`);
                  } catch (error) {
                    setRequestError(
                      error instanceof Error
                        ? error.message
                        : 'Could not create custom musician profile',
                    );
                  } finally {
                    setIsRequesting(false);
                  }
                }}
                className="rounded border px-3 py-2"
              >
                {isRequesting ? 'Requesting...' : `Generate lessons for "${query.trim()}"`}
              </button>
              {requestError ? <p className="text-sm text-red-600">{requestError}</p> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {genres.map((group) => (
            <section key={group.label} className="space-y-3">
              <h2 className="text-lg font-semibold">{group.label}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {group.musicians.map((musician) => (
                  <MusicianCard
                    key={musician.id}
                    musician={musician}
                    onSelect={(slug) => router.push(`/styles/${slug}`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
