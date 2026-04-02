import { Box, Divider } from '@mui/material';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import SecuritySettingsContent from '../../features/auth/components/SecuritySettingsContent';
import BillingPageContent from '../../features/billing/components/BillingPageContent';
import { parseSessionToken } from '../../lib/auth';

export const metadata = {
  title: 'Account',
};

export default async function AccountPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('progressionlab_session')?.value;
  const session = parseSessionToken(sessionToken);

  if (!session) {
    redirect('/auth?reason=account');
  }

  return (
    <Suspense
      fallback={<PageSuspenseFallback messageKey="settings.loadingAccount" maxWidth="lg" />}
    >
      <Box>
        <BillingPageContent />
        <Divider sx={{ my: 2 }} />
        <SecuritySettingsContent />
      </Box>
    </Suspense>
  );
}
