import { Suspense } from 'react';
import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import MusicianRoster from '../../features/musician-styles/components/MusicianRoster';

export default function StylesPage() {
  return (
    <Suspense
      fallback={
        <PageSuspenseFallback
          messageKey="settings.loadingLessons"
          maxWidth="md"
          variant="lessons"
        />
      }
    >
      <MusicianRoster />
    </Suspense>
  );
}
