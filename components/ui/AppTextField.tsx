import { TextField, type TextFieldProps } from '@mui/material';

export default function AppTextField(props: TextFieldProps) {
  return <TextField fullWidth variant="outlined" {...props} />;
}
