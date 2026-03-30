import { Suspense } from 'react';

import PageSuspenseFallback from '../../../components/ui/PageSuspenseFallback';
import BillingPageContent from '../../../features/billing/components/BillingPageContent';

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={<PageSuspenseFallback message="Loading billing..." maxWidth="lg" />}>
      <BillingPageContent />
    </Suspense>
  );
}
