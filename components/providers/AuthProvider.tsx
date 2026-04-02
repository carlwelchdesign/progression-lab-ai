'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';

import { createCsrfHeaders } from '../../lib/csrfClient';

/**
 * Authenticated user shape returned by /api/auth/me.
 */
type User = {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'AUDITOR' | 'USER';
  createdAt: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_CACHE_KEY = 'auth_cache_v1';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : (error as { name?: string })?.name === 'AbortError';
}

// Global flag to track if auth has been initialized
let authInitialized = false;

/**
 * Provides auth state, refresh, and logout actions to the client app tree.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    refreshControllerRef.current?.abort();
    const controller = new AbortController();
    refreshControllerRef.current = controller;

    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
        signal: controller.signal,
      });

      if (response.ok) {
        const data = (await response.json()) as { user: User };
        setUser(data.user);
        setIsAuthenticated(true);
        // Update cache after successful fetch
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data));
      } else {
        setIsAuthenticated(false);
        setUser(null);
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ authenticated: false }));
      }
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      setIsAuthenticated(false);
      setUser(null);
    } finally {
      if (refreshControllerRef.current === controller) {
        refreshControllerRef.current = null;
      }
    }
  }, []);

  useEffect(
    () => () => {
      refreshControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    // Only run once per app initialization
    if (authInitialized) {
      const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached) as { user?: User; authenticated?: false };
        if (parsedCache.user) {
          setUser(parsedCache.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
      return;
    }

    authInitialized = true;
    const controller = new AbortController();

    const loadAuth = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached) as { user?: User; authenticated?: false };
          if (parsedCache.user) {
            setUser(parsedCache.user);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
          setIsLoading(false);

          // Revalidate cached auth state in the background so stale sessionStorage
          // cannot keep the UI in an authenticated state after the cookie expires.
          void refresh();
          return;
        }

        // Fetch from API only if no cache
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.ok) {
          const data = (await response.json()) as { user: User };
          setUser(data.user);
          setIsAuthenticated(true);
          sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data));
        } else {
          setIsAuthenticated(false);
          setUser(null);
          sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ authenticated: false }));
        }
        setIsLoading(false);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
      }
    };

    loadAuth();

    return () => {
      controller.abort();
    };
  }, [refresh]);

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: createCsrfHeaders(),
    });
    setIsAuthenticated(false);
    setUser(null);
    sessionStorage.removeItem(AUTH_CACHE_KEY);
    router.push('/pricing');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Accesses the auth context and enforces provider usage.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
