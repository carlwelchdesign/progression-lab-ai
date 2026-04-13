import { prisma } from '../../lib/prisma';
import { listActiveMusicians } from '../../features/musician-styles/services/musicianRepository';
import { MusicianRoster } from '../../features/musician-styles/components/MusicianRoster';

export const dynamic = 'force-dynamic';

export default async function StylesPage() {
  // Page is still protected by API auth checks; this is a soft gate for UX.
  const musicians = await listActiveMusicians(prisma);

  const grouped = musicians.reduce<Record<string, typeof musicians>>((acc, musician) => {
    if (!acc[musician.genre]) {
      acc[musician.genre] = [];
    }

    acc[musician.genre].push(musician);
    return acc;
  }, {});

  const genres = Object.entries(grouped).map(([label, items]) => ({
    label,
    musicians: items,
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Piano Lessons from the Legends</h1>
        <p className="text-sm text-gray-600">
          Search or browse a pianist to start your MIDI-first lesson path.
        </p>
      </header>
      <MusicianRoster genres={genres} />
    </main>
  );
}
