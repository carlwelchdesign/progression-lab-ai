export type AppTextDirection = 'ltr' | 'rtl';

type LocaleDefinitionShape = {
  code: string;
  baseLanguage: string;
  nativeLabel: string;
  englishLabel: string;
  direction: AppTextDirection;
  modelLanguage: string;
};

export const DEFAULT_APP_LOCALE = 'en';

export const SUPPORTED_LOCALES = [
  {
    code: 'en',
    baseLanguage: 'en',
    nativeLabel: 'English',
    englishLabel: 'English',
    direction: 'ltr',
    modelLanguage: 'English',
  },
  {
    code: 'es',
    baseLanguage: 'es',
    nativeLabel: 'Espanol',
    englishLabel: 'Spanish',
    direction: 'ltr',
    modelLanguage: 'Spanish',
  },
  {
    code: 'fr',
    baseLanguage: 'fr',
    nativeLabel: 'Francais',
    englishLabel: 'French',
    direction: 'ltr',
    modelLanguage: 'French',
  },
  {
    code: 'el',
    baseLanguage: 'el',
    nativeLabel: 'Ellinika',
    englishLabel: 'Greek',
    direction: 'ltr',
    modelLanguage: 'Greek',
  },
  {
    code: 'de',
    baseLanguage: 'de',
    nativeLabel: 'Deutsch',
    englishLabel: 'German',
    direction: 'ltr',
    modelLanguage: 'German',
  },
  {
    code: 'it',
    baseLanguage: 'it',
    nativeLabel: 'Italiano',
    englishLabel: 'Italian',
    direction: 'ltr',
    modelLanguage: 'Italian',
  },
  {
    code: 'pt-BR',
    baseLanguage: 'pt',
    nativeLabel: 'Portugues (Brasil)',
    englishLabel: 'Portuguese (Brazil)',
    direction: 'ltr',
    modelLanguage: 'Brazilian Portuguese',
  },
  {
    code: 'nl',
    baseLanguage: 'nl',
    nativeLabel: 'Nederlands',
    englishLabel: 'Dutch',
    direction: 'ltr',
    modelLanguage: 'Dutch',
  },
  {
    code: 'pl',
    baseLanguage: 'pl',
    nativeLabel: 'Polski',
    englishLabel: 'Polish',
    direction: 'ltr',
    modelLanguage: 'Polish',
  },
  {
    code: 'tr',
    baseLanguage: 'tr',
    nativeLabel: 'Turkce',
    englishLabel: 'Turkish',
    direction: 'ltr',
    modelLanguage: 'Turkish',
  },
  {
    code: 'ja',
    baseLanguage: 'ja',
    nativeLabel: 'Japanese',
    englishLabel: 'Japanese',
    direction: 'ltr',
    modelLanguage: 'Japanese',
  },
  {
    code: 'ko',
    baseLanguage: 'ko',
    nativeLabel: 'Korean',
    englishLabel: 'Korean',
    direction: 'ltr',
    modelLanguage: 'Korean',
  },
  {
    code: 'zh-CN',
    baseLanguage: 'zh',
    nativeLabel: 'Chinese (Simplified)',
    englishLabel: 'Chinese (Simplified)',
    direction: 'ltr',
    modelLanguage: 'Simplified Chinese',
  },
  {
    code: 'zh-TW',
    baseLanguage: 'zh',
    nativeLabel: 'Chinese (Traditional)',
    englishLabel: 'Chinese (Traditional)',
    direction: 'ltr',
    modelLanguage: 'Traditional Chinese',
  },
  {
    code: 'hi',
    baseLanguage: 'hi',
    nativeLabel: 'Hindi',
    englishLabel: 'Hindi',
    direction: 'ltr',
    modelLanguage: 'Hindi',
  },
  {
    code: 'ar',
    baseLanguage: 'ar',
    nativeLabel: 'Arabic',
    englishLabel: 'Arabic',
    direction: 'rtl',
    modelLanguage: 'Arabic',
  },
  {
    code: 'he',
    baseLanguage: 'he',
    nativeLabel: 'Hebrew',
    englishLabel: 'Hebrew',
    direction: 'rtl',
    modelLanguage: 'Hebrew',
  },
] as const satisfies readonly LocaleDefinitionShape[];

export type LocaleDefinition = (typeof SUPPORTED_LOCALES)[number];

export type AppLocaleCode = LocaleDefinition['code'];

const localeByNormalizedCode = new Map<string, LocaleDefinition>(
  SUPPORTED_LOCALES.map((locale) => [locale.code.toLowerCase(), locale]),
);

const localeByBaseLanguage = new Map<string, LocaleDefinition>(
  SUPPORTED_LOCALES.map((locale) => [locale.baseLanguage.toLowerCase(), locale]),
);

export function getLocaleDefinition(locale: string): LocaleDefinition {
  return (
    localeByNormalizedCode.get(locale.toLowerCase()) ??
    localeByNormalizedCode.get(DEFAULT_APP_LOCALE)!
  );
}

export function normalizeAppLocale(input: unknown): AppLocaleCode {
  if (typeof input !== 'string') {
    return DEFAULT_APP_LOCALE;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return DEFAULT_APP_LOCALE;
  }

  const normalized = trimmed.replace(/_/g, '-').toLowerCase();
  const exactMatch = localeByNormalizedCode.get(normalized);
  if (exactMatch) {
    return exactMatch.code;
  }

  const language = normalized.split('-')[0];
  const languageMatch = localeByBaseLanguage.get(language);
  if (languageMatch) {
    if (language === 'zh' && normalized.includes('hant')) {
      return 'zh-TW';
    }

    return languageMatch.code;
  }

  return DEFAULT_APP_LOCALE;
}

export function detectPreferredLocale(candidates: readonly string[]): AppLocaleCode {
  for (const candidate of candidates) {
    const normalized = normalizeAppLocale(candidate);
    if (
      normalized !== DEFAULT_APP_LOCALE ||
      candidate.toLowerCase().startsWith(DEFAULT_APP_LOCALE)
    ) {
      return normalized;
    }
  }

  return DEFAULT_APP_LOCALE;
}
