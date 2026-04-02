import { Container, Divider, Stack } from '@mui/material';
import { Suspense, lazy } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import PageSuspenseFallback from '../../components/ui/PageSuspenseFallback';
import BillingSection from './BillingSection';
import { parseSessionToken } from '../../lib/auth';

const SecuritySettingsContent = lazy(
  () => import('../../features/auth/components/SecuritySettingsContent'),
);

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
      fallback={
        <PageSuspenseFallback
          messageKey="settings.loadingAccount"
          maxWidth="md"
          variant="account"
        />
      }
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Suspense
            fallback={
              <PageSuspenseFallback
                messageKey="settings.loadingBilling"
                maxWidth="md"
                padded={false}
                variant="account"
              />
            }
          >
            <BillingSection session={{ userId: session.userId, role: session.role }} />
          </Suspense>
          <Divider />
          <Suspense
            fallback={
              <PageSuspenseFallback
                messageKey="settings.loadingSecurity"
                maxWidth="md"
                padded={false}
                variant="account"
              />
            }
          >
            <SecuritySettingsContent suppressUnauthenticatedNotice />
          </Suspense>
        </Stack>
      </Container>
    </Suspense>
  );
}
