'use client';

import LanguageIcon from '@mui/icons-material/Language';
import { Box, IconButton, Popover, Tooltip } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppLocale } from '../providers/LocaleProvider';

type LanguageSwitcherProps = {
  fullWidth?: boolean;
};

const FLAG_BY_LOCALE: Record<string, string> = {
  en: 'GB',
  es: 'ES',
  fr: 'FR',
  el: 'GR',
  de: 'DE',
  it: 'IT',
  'pt-BR': 'BR',
  nl: 'NL',
  pl: 'PL',
  tr: 'TR',
  ja: 'JP',
  ko: 'KR',
  'zh-CN': 'CN',
  'zh-TW': 'TW',
  hi: 'IN',
  ar: 'SA',
  he: 'IL',
};

function countryCodeToFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split('')
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join('');
}

export default function LanguageSwitcher({ fullWidth = false }: LanguageSwitcherProps) {
  const { t } = useTranslation('common');
  const { locale, setLocale, supportedLocales } = useAppLocale();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const activeLocale = useMemo(
    () => supportedLocales.find((supportedLocale) => supportedLocale.code === locale),
    [locale, supportedLocales],
  );

  const open = Boolean(anchorEl);

  const resolveLocaleFlag = (localeCode: string) => {
    const countryCode = FLAG_BY_LOCALE[localeCode];
    return countryCode ? countryCodeToFlagEmoji(countryCode) : null;
  };

  const activeFlag = activeLocale ? resolveLocaleFlag(activeLocale.code) : null;

  return (
    <>
      <Tooltip title={t('languageLabel')}>
        <IconButton
          size="small"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label={t('languageSelectorAriaLabel')}
          aria-controls={open ? 'language-flag-popover' : undefined}
          aria-haspopup="menu"
          aria-expanded={open ? 'true' : undefined}
          sx={{
            width: fullWidth ? '100%' : 36,
            height: 36,
            border: 1,
            borderColor: 'divider',
            borderRadius: fullWidth ? 1.5 : '50%',
            justifyContent: 'center',
          }}
        >
          {activeFlag ? (
            <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
              {activeFlag}
            </Box>
          ) : (
            <LanguageIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        id="language-flag-popover"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box
          role="menu"
          aria-label={t('languageSelectorAriaLabel')}
          sx={{
            p: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 0.5,
            width: 252,
            maxWidth: 'calc(100vw - 24px)',
          }}
        >
          {supportedLocales.map((supportedLocale) => {
            const localeFlag = resolveLocaleFlag(supportedLocale.code);
            const selected = supportedLocale.code === locale;

            return (
              <Tooltip
                key={supportedLocale.code}
                title={`${supportedLocale.nativeLabel} (${supportedLocale.englishLabel})`}
              >
                <IconButton
                  size="small"
                  role="menuitemradio"
                  aria-checked={selected}
                  aria-label={`${supportedLocale.nativeLabel} (${supportedLocale.englishLabel})`}
                  onClick={() => {
                    setLocale(supportedLocale.code);
                    setAnchorEl(null);
                  }}
                  sx={{
                    width: 34,
                    height: 34,
                    border: 1,
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: selected ? 'action.selected' : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  {localeFlag ? (
                    <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
                      {localeFlag}
                    </Box>
                  ) : (
                    <LanguageIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}
