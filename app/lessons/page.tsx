import { Suspense } from 'react';
import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import LessonsPageContent from '../../features/lessons/components/LessonsPageContent';

export default function LessonsPage() {
  return (
    <Suspense
      fallback={
        <PageSuspenseFallback
          messageKey="settings.loadingLessons"
          maxWidth="lg"
          variant="lessons"
        />
      }
    >
      <LessonsPageContent />
    </Suspense>
  );
}
