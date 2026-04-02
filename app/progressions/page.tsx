import { Suspense } from 'react';
import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import ProgressionsPageContent from '../../features/progressions/components/ProgressionsPageContent';

export default function ProgressionsPage() {
  return (
    <Suspense
      fallback={
        <PageSuspenseFallback
          messageKey="settings.loadingProgressions"
          maxWidth="lg"
          variant="progressions"
        />
      }
    >
      <ProgressionsPageContent />
    </Suspense>
  );
}
