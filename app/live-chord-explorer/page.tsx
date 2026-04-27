import { Suspense } from 'react';
import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import LiveChordExplorerPageContent from '../../features/live-chord-explorer/components/LiveChordExplorerPageContent';

export const metadata = {
  title: 'Live Chord Explorer',
  description: 'Connect a MIDI keyboard, detect chords in real-time, and discover harmonic paths.',
};

export default function LiveChordExplorerPage() {
  return (
    <Suspense
      fallback={
        <PageSuspenseFallback
          message="Loading Live Chord Explorer…"
          maxWidth="xl"
          variant="studio"
        />
      }
    >
      <LiveChordExplorerPageContent />
    </Suspense>
  );
}
