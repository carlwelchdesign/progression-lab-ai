'use client';

import LanguageIcon from '@mui/icons-material/Language';
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
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
          aria-controls={open ? 'language-flag-menu' : undefined}
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

      <Menu
        id="language-flag-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ 'aria-label': t('languageSelectorAriaLabel') }}
      >
        {supportedLocales.map((supportedLocale) => {
          const localeFlag = resolveLocaleFlag(supportedLocale.code);
          return (
            <MenuItem
              key={supportedLocale.code}
              selected={supportedLocale.code === locale}
              onClick={() => {
                setLocale(supportedLocale.code);
                setAnchorEl(null);
              }}
              aria-label={`${supportedLocale.nativeLabel} (${supportedLocale.englishLabel})`}
              sx={{ minWidth: 56, justifyContent: 'center' }}
            >
              {localeFlag ? (
                <Box component="span" sx={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
                  {localeFlag}
                </Box>
              ) : (
                <LanguageIcon fontSize="small" />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
