import type { TextFieldProps } from '@mui/material';

import TextField from './TextField';

/**
 * Option item for native select field rendering.
 */
type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps = Omit<TextFieldProps, 'select' | 'children'> & {
  options: Option[];
};

/**
 * Shared native select wrapper based on app TextField defaults.
 */
export default function SelectField({ options, ...props }: SelectFieldProps) {
  return (
    <TextField select SelectProps={{ native: true }} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </TextField>
  );
}
