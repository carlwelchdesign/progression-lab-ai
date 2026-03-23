'use client';

import type { ReactNode } from 'react';
import { Box, Button, Card, CardContent, Slider, Stack, Switch, Typography } from '@mui/material';

type EffectSettingsCardProps = {
  title: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  level: number;
  onLevelChange: (value: number) => void;
  levelAriaLabel: string;
  advancedOpen: boolean;
  onAdvancedToggle: () => void;
  children?: ReactNode;
};

export default function EffectSettingsCard({
  title,
  enabled,
  onEnabledChange,
  level,
  onLevelChange,
  levelAriaLabel,
  advancedOpen,
  onAdvancedToggle,
  children,
}: EffectSettingsCardProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Switch
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
            inputProps={{ 'aria-label': `${title} enabled` }}
          />
        </Box>

        <Stack spacing={1.5} sx={{ opacity: enabled ? 1 : 0.45 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Level: {Math.round(level * 100)}%
            </Typography>
            <Slider
              size="small"
              value={level}
              onChange={(_, value) => onLevelChange(value as number)}
              min={0}
              max={1}
              step={0.01}
              aria-label={levelAriaLabel}
              disabled={!enabled}
            />
          </Box>

          {children ? (
            <>
              <Button
                size="small"
                variant="text"
                onClick={onAdvancedToggle}
                sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
              >
                {advancedOpen ? 'Hide advanced' : 'Show advanced'}
              </Button>
              {advancedOpen ? children : null}
            </>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
