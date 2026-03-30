import { Suspense } from 'react';

import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import PricingPageContent from '../../features/billing/components/PricingPageContent';

export default function PricingPage() {
  return (
    <Suspense fallback={<PageSuspenseFallback message="Loading pricing..." maxWidth="lg" />}>
      <PricingPageContent />
    </Suspense>
  );
}
