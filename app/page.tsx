import { Suspense } from 'react';
import HomePageLayout from '../features/home/components/HomePageLayout';
import PageSuspenseFallback from '../components/ui/PageSuspenseFallback';

export default function HomePage() {
  // No-op update to trigger production deployment.
  return (
    <Suspense fallback={<PageSuspenseFallback messageKey="settings.loadingStudio" maxWidth="xl" />}>
      <HomePageLayout />
    </Suspense>
  );
}
