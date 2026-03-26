import { Alert, Snackbar } from '@mui/material';
import type { AlertColor } from '@mui/material';

/**
 * Props for the reusable status snackbar component.
 */
type StatusSnackbarProps = {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
};

/**
 * Bottom-right status toast for success, error, warning, and info feedback.
 */
export default function StatusSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 6000,
}: StatusSnackbarProps) {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={onClose}
        sx={{ color: (theme) => theme.palette.common.white }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
