import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_APP_LOCALE, SUPPORTED_LOCALES } from './locales';
import { translationResources } from './resources';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: translationResources,
    ns: ['common', 'nav', 'generator'],
    defaultNS: 'common',
    lng: DEFAULT_APP_LOCALE,
    fallbackLng: DEFAULT_APP_LOCALE,
    supportedLngs: SUPPORTED_LOCALES.map((locale) => locale.code),
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;
