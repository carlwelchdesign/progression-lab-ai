import type { TextFieldProps } from '@mui/material';

import AppTextField from './AppTextField';

type Option = {
  value: string;
  label: string;
};

type AppSelectFieldProps = Omit<TextFieldProps, 'select' | 'children'> & {
  options: Option[];
};

export default function AppSelectField({ options, ...props }: AppSelectFieldProps) {
  return (
    <AppTextField select SelectProps={{ native: true }} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </AppTextField>
  );
}
