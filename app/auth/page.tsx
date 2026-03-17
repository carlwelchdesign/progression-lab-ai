'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? 'Authentication failed');
      }

      window.location.href = '/progressions';
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Account
              </Typography>
              <Typography color="text.secondary">
                Register or sign in to access your saved progressions.
              </Typography>
            </Box>

            <ToggleButtonGroup
              exclusive
              value={mode}
              onChange={(_e, value: AuthMode | null) => {
                if (value) {
                  setMode(value);
                  setError('');
                }
              }}
              size="small"
            >
              <ToggleButton value="login">Login</ToggleButton>
              <ToggleButton value="register">Register</ToggleButton>
            </ToggleButtonGroup>

            {mode === 'register' ? (
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
            ) : null}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              helperText={mode === 'register' ? 'Minimum 8 characters' : undefined}
            />

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
