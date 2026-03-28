'use client';

import { MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useAppLocale } from '../providers/LocaleProvider';

type LanguageSwitcherProps = {
  fullWidth?: boolean;
};

export default function LanguageSwitcher({ fullWidth = false }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { locale, setLocale, supportedLocales } = useAppLocale();

  return (
    <TextField
      select
      size="small"
      value={locale}
      onChange={(event) => setLocale(event.target.value)}
      label={t('common.languageLabel')}
      inputProps={{
        'aria-label': t('common.languageSelectorAriaLabel'),
      }}
      sx={{ minWidth: fullWidth ? '100%' : 180 }}
      fullWidth={fullWidth}
    >
      {supportedLocales.map((supportedLocale) => (
        <MenuItem key={supportedLocale.code} value={supportedLocale.code}>
          {supportedLocale.nativeLabel}
        </MenuItem>
      ))}
    </TextField>
  );
}
