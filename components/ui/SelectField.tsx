import type { TextFieldProps } from '@mui/material';

import TextField from './TextField';

type Option = {
  value: string;
  label: string;
};

type SelectFieldProps = Omit<TextFieldProps, 'select' | 'children'> & {
  options: Option[];
};

export default function SelectField({ options, ...props }: SelectFieldProps) {
  return (
    <TextField select SelectProps={{ native: true }} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </TextField>
  );
}
