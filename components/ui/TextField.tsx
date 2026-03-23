import { TextField as MuiTextField, type TextFieldProps } from '@mui/material';

/**
 * Shared text field wrapper with consistent defaults.
 */
export default function TextField(props: TextFieldProps) {
  return (
    <MuiTextField fullWidth variant="outlined" InputLabelProps={{ shrink: true }} {...props} />
  );
}
