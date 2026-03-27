import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box, Chip, Divider, Stack, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { getThemeTokens } from '../../lib/themeTokens';
import type { ThemePreset } from '../../lib/themeMode';

type ThemeTokensPreviewProps = {
  mode: 'light' | 'dark';
  preset: ThemePreset;
};

type ThemeTokensMatrixProps = {
  mode: 'light' | 'dark';
  preset: ThemePreset;
};

type TokenEntry = {
  key: string;
  value: string;
};

function flattenTokenGroup(group: Record<string, string | string[]>, prefix: string): TokenEntry[] {
  return Object.entries(group).flatMap(([key, rawValue]) => {
    if (Array.isArray(rawValue)) {
      return rawValue.map((value, index) => ({
        key: `${prefix}.${key}[${index}]`,
        value,
      }));
    }

    return [{ key: `${prefix}.${key}`, value: rawValue }];
  });
}

function TokenSwatch({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        width: '100%',
        minWidth: 0,
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          height: 36,
          background: value,
        }}
      />
      <Box sx={{ p: 1 }}>
        <Tooltip title={label} placement="top-start" arrow>
          <Typography
            variant="caption"
            sx={{
              display: '-webkit-box',
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              minHeight: 32,
            }}
          >
            {label}
          </Typography>
        </Tooltip>
        <Tooltip title={value} placement="bottom-start" arrow>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: 12,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              minHeight: 54,
            }}
          >
            {value}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
}

function TokenGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

function ThemeTokensPreview({ mode, preset }: ThemeTokensPreviewProps) {
  const tokens = getThemeTokens(mode, preset);
  const palette = tokens.palette;
  const appColors = palette?.appColors;
  const surfaceTokens = appColors ? flattenTokenGroup(appColors.surface, 'surface') : [];
  const accentTokens = appColors ? flattenTokenGroup(appColors.accent, 'accent') : [];
  const tagTokens = appColors ? flattenTokenGroup(appColors.tags, 'tags') : [];

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip label={`mode: ${mode}`} color="primary" variant="outlined" />
          <Chip label={`preset: ${preset}`} variant="outlined" />
          <Chip label={`radius: ${tokens.shape?.borderRadius ?? 'n/a'}`} variant="outlined" />
        </Stack>

        <TokenGroup title="Core Palette">
          <TokenSwatch label="primary.main" value={palette?.primary?.main ?? '#000000'} />
          <TokenSwatch
            label="background.default"
            value={palette?.background?.default ?? '#000000'}
          />
          <TokenSwatch label="background.paper" value={palette?.background?.paper ?? '#000000'} />
        </TokenGroup>

        <Divider />

        <TokenGroup title="Surface Tokens">
          {surfaceTokens.map((token) => (
            <TokenSwatch key={token.key} label={token.key} value={token.value} />
          ))}
        </TokenGroup>

        <Divider />

        <TokenGroup title="Accent Tokens">
          {accentTokens.map((token) => (
            <TokenSwatch key={token.key} label={token.key} value={token.value} />
          ))}
        </TokenGroup>

        <Divider />

        <TokenGroup title="Tag Tokens">
          {tagTokens.map((token) => (
            <TokenSwatch key={token.key} label={token.key} value={token.value} />
          ))}
        </TokenGroup>
      </Stack>
    </Box>
  );
}

function ThemeTokensMatrix({ mode, preset }: ThemeTokensMatrixProps) {
  const combinations: Array<{ mode: 'light' | 'dark'; preset: ThemePreset }> = [
    { mode: 'dark', preset: 'default' },
    { mode: 'dark', preset: 'solid' },
    { mode: 'dark', preset: 'dry' },
    { mode: 'light', preset: 'default' },
    { mode: 'light', preset: 'solid' },
    { mode: 'light', preset: 'dry' },
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Matrix view for fast visual regression checks across all mode/preset combinations.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            xl: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {combinations.map((combination) => (
          <Box key={`${combination.mode}-${combination.preset}`}>
            <ThemeTokensPreview mode={combination.mode} preset={combination.preset} />
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

const meta: Meta<typeof ThemeTokensPreview> = {
  title: 'Design System/Theme Tokens',
  component: ThemeTokensPreview,
  tags: ['autodocs'],
  args: {
    mode: 'dark',
    preset: 'default',
  },
  argTypes: {
    mode: {
      options: ['dark', 'light'],
      control: { type: 'radio' },
    },
    preset: {
      options: ['default', 'solid', 'dry'],
      control: { type: 'inline-radio' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Token inspector for visual regression checks across mode/preset combinations. Useful for validating palette, surface, accent, and tag color token changes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeTokensPreview>;

export const Interactive: Story = {};

export const LightDefault: Story = {
  args: {
    mode: 'light',
    preset: 'default',
  },
};

export const DarkDry: Story = {
  args: {
    mode: 'dark',
    preset: 'dry',
  },
};

export const AllCombinations: StoryObj<typeof ThemeTokensMatrix> = {
  render: () => <ThemeTokensMatrix mode="dark" preset="default" />,
  parameters: {
    controls: { disable: true },
  },
};
