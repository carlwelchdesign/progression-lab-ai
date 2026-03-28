import ar from './translations/ar.json';
import de from './translations/de.json';
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import he from './translations/he.json';
import hi from './translations/hi.json';
import it from './translations/it.json';
import ja from './translations/ja.json';
import ko from './translations/ko.json';
import nl from './translations/nl.json';
import pl from './translations/pl.json';
import ptBR from './translations/pt-BR.json';
import tr from './translations/tr.json';
import zhCN from './translations/zh-CN.json';
import zhTW from './translations/zh-TW.json';

export const translationResources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  'pt-BR': { translation: ptBR },
  nl: { translation: nl },
  pl: { translation: pl },
  tr: { translation: tr },
  ja: { translation: ja },
  ko: { translation: ko },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  hi: { translation: hi },
  ar: { translation: ar },
  he: { translation: he },
} as const;
