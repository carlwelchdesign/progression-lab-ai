import { Alert, Snackbar } from '@mui/material';

/**
 * Props for the reusable success snackbar component.
 */
type SuccessSnackbarProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
};

/**
 * Bottom-right success toast used after save/update actions.
 */
export default function SuccessSnackbar({
  open,
  message,
  onClose,
  autoHideDuration = 6000,
}: SuccessSnackbarProps) {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
    >
      <Alert severity="success" variant="filled" onClose={onClose} sx={{ color: '#fff' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
