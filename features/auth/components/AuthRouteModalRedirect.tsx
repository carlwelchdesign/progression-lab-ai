'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthModal } from '../../../components/providers/AuthModalProvider';

export default function AuthRouteModalRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuthModal();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) {
      return;
    }

    hasHandledRef.current = true;

    const modeParam = searchParams.get('mode');
    const reasonParam = searchParams.get('reason');

    const mode = modeParam === 'register' ? 'register' : 'login';
    const reason =
      reasonParam === 'my-progressions'
        ? 'my-progressions'
        : reasonParam === 'save-arrangement'
          ? 'save-arrangement'
          : reasonParam === 'upgrade-plan'
            ? 'upgrade-plan'
            : 'generic';

    openAuthModal({ mode, reason });
    router.replace('/');
  }, [openAuthModal, router, searchParams]);

  return null;
}
