import { Suspense } from 'react';
import AuthRouteModalRedirect from '../../features/auth/components/AuthRouteModalRedirect';

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthRouteModalRedirect />
    </Suspense>
  );
}
