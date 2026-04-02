import { Suspense } from 'react';

import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import PricingPageContent from '../../features/billing/components/PricingPageContent';

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <PageSuspenseFallback
          messageKey="settings.loadingPricing"
          maxWidth="lg"
          variant="pricing"
        />
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}
