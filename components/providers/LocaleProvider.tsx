'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import i18n from '../../lib/i18n/init';
import {
  DEFAULT_APP_LOCALE,
  detectPreferredLocale,
  getLocaleDefinition,
  normalizeAppLocale,
  SUPPORTED_LOCALES,
  type AppLocaleCode,
  type AppTextDirection,
  type LocaleDefinition,
} from '../../lib/i18n/locales';

const APP_LOCALE_STORAGE_KEY = 'app-locale';

type LocaleContextValue = {
  locale: AppLocaleCode;
  direction: AppTextDirection;
  localeDefinition: LocaleDefinition;
  supportedLocales: readonly LocaleDefinition[];
  setLocale: (locale: string) => void;
};

const defaultLocaleDefinition = getLocaleDefinition(DEFAULT_APP_LOCALE);

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_APP_LOCALE,
  direction: defaultLocaleDefinition.direction,
  localeDefinition: defaultLocaleDefinition,
  supportedLocales: SUPPORTED_LOCALES,
  setLocale: () => {},
});

function readInitialLocale(): AppLocaleCode {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_LOCALE;
  }

  const storedLocale = localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  if (storedLocale) {
    return normalizeAppLocale(storedLocale);
  }

  return detectPreferredLocale([...navigator.languages, navigator.language]);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocaleCode>(DEFAULT_APP_LOCALE);

  useEffect(() => {
    setLocaleState(readInitialLocale());
  }, []);

  useEffect(() => {
    const localeDefinition = getLocaleDefinition(locale);

    localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDefinition.direction;
  }, [locale]);

  const setLocale = useCallback((nextLocale: string) => {
    setLocaleState(normalizeAppLocale(nextLocale));
  }, []);

  const localeDefinition = useMemo(() => getLocaleDefinition(locale), [locale]);

  const contextValue = useMemo(
    () => ({
      locale,
      direction: localeDefinition.direction,
      localeDefinition,
      supportedLocales: SUPPORTED_LOCALES,
      setLocale,
    }),
    [locale, localeDefinition, setLocale],
  );

  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>;
}

export function useAppLocale() {
  return useContext(LocaleContext);
}
