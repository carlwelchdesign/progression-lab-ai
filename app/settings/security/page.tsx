import { Suspense } from 'react';

import PageSuspenseFallback from '../../../components/ui/PageSuspenseFallback';
import SecuritySettingsContent from '../../../features/auth/components/SecuritySettingsContent';

export const metadata = {
  title: 'Security Keys',
};

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={<PageSuspenseFallback message="Loading security settings..." maxWidth="md" />}>
      <SecuritySettingsContent />
    </Suspense>
  );
}
