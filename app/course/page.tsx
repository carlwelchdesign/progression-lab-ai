import { Suspense } from 'react';
import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import CoursePageContent from '../../features/course/components/CoursePageContent';

export default function CoursePage() {
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
      <CoursePageContent />
    </Suspense>
  );
}
