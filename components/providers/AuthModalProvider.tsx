'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import AuthModalDialog, {
  type AuthDialogReason,
  type AuthMode,
} from '../../features/auth/components/AuthModalDialog';

type OpenAuthModalOptions = {
  mode?: AuthMode;
  reason?: AuthDialogReason;
  onSuccess?: () => void;
};

type AuthModalContextValue = {
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [reason, setReason] = useState<AuthDialogReason>('generic');
  const successCallbackRef = useRef<(() => void) | null>(null);

  const closeAuthModal = useCallback(() => {
    setOpen(false);
  }, []);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions) => {
    setMode(options?.mode ?? 'login');
    setReason(options?.reason ?? 'generic');
    successCallbackRef.current = options?.onSuccess ?? null;
    setOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    const callback = successCallbackRef.current;
    successCallbackRef.current = null;
    callback?.();
  }, []);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModalDialog
        open={open}
        onClose={closeAuthModal}
        onSuccess={handleSuccess}
        initialMode={mode}
        reason={reason}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }

  return context;
}
