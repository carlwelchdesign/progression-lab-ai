'use client';

import { Box, Button, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { createPadDragPayload, PAD_DRAG_MIME_TYPE } from './padDragPayload';
import { getChordBorderColor } from './chordGridUtils';
import type { ChordGridEntry } from './chordGridTypes';

type PadHotkeyBinding = { entry: ChordGridEntry; hotkey: string | null };

type ChordPadGridProps = {
  padHotkeyBindings: PadHotkeyBinding[];
  activePadKey: string | null;
  editingPadKey: string | null;
  cofHighlightedKeys: Set<string>;
  isMobile: boolean;
  showKeyboardHints: boolean;
  onPadPress: (entry: ChordGridEntry) => void;
  onMobilePointerDown: (
    entry: ChordGridEntry,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
};

/**
 * Renders the 4-column responsive grid of chord pad buttons.
 * Handles drag-and-drop initiation, hotkey badge rendering, and visual states
 * (active / editing / CoF-highlighted). Fires onPadPress — contains no audio logic.
 * SRP: changes when pad visual design or drag behaviour changes.
 */
export default function ChordPadGrid({
  padHotkeyBindings,
  activePadKey,
  editingPadKey,
  cofHighlightedKeys,
  isMobile,
  showKeyboardHints,
  onPadPress,
  onMobilePointerDown,
}: ChordPadGridProps) {
  const theme = useTheme();
  const { appColors } = theme.palette;

  const padStyles = {
    body: {
      bg: appColors.surface.chordPadBodyGradient,
      bgHover: appColors.surface.chordPadBodyGradientHover,
    },
    active: {
      bg: appColors.surface.chordPadActiveGradient,
      border: appColors.accent.chordPadActiveBorder,
    },
  } as const;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(4, minmax(0, 1fr))',
          sm: 'repeat(4, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
        },
        gap: { xs: 1, sm: 1.5 },
        p: { xs: 0.5, sm: 1 },
        borderRadius: 2,
        bgcolor: appColors.surface.chordPadGridBackground,
        border: `1px solid ${appColors.surface.translucentPanelBorder}`,
      }}
    >
      {padHotkeyBindings.map(({ entry, hotkey }) => {
        const isActive = activePadKey === entry.key;
        const isEditing = editingPadKey === entry.key;
        const isCoFHighlighted = cofHighlightedKeys.has(entry.key);
        const borderColor = getChordBorderColor(
          entry.chord,
          appColors.accent.chordSuggestionBorders,
        );
        const editingBorderColor = appColors.accent.chordPadEditBorder;
        const cofBorderColor = appColors.accent.chordPadCofBorder;
        const cofGlowColor = appColors.accent.chordPadCofGlow;
        const hotkeyLabel = hotkey ? hotkey.toUpperCase() : null;

        return (
          <Button
            key={entry.key}
            variant="contained"
            draggable={!isMobile}
            onDragStart={(event) => {
              const payload = createPadDragPayload(entry.key);
              event.dataTransfer.setData(PAD_DRAG_MIME_TYPE, payload);
              event.dataTransfer.setData('text/plain', payload);
              event.dataTransfer.effectAllowed = 'copy';

              // Custom drag image: same height as timeline clips (42px).
              const dragImageEl = document.createElement('div');
              dragImageEl.style.width = '50px';
              dragImageEl.style.height = '42px';
              dragImageEl.style.backgroundColor = '#6b7280';
              dragImageEl.style.border = '2px solid #374151';
              dragImageEl.style.borderRadius = '4px';
              dragImageEl.style.display = 'flex';
              dragImageEl.style.alignItems = 'center';
              dragImageEl.style.justifyContent = 'center';
              dragImageEl.style.fontSize = '10px';
              dragImageEl.style.fontWeight = '700';
              dragImageEl.style.color = '#ffffff';
              dragImageEl.style.overflow = 'hidden';
              dragImageEl.style.position = 'absolute';
              dragImageEl.style.left = '-9999px';
              dragImageEl.style.top = '-9999px';
              dragImageEl.textContent = entry.chord;
              document.body.appendChild(dragImageEl);
              event.dataTransfer.setDragImage(dragImageEl, 0, 21);
              setTimeout(() => dragImageEl.remove(), 0);
            }}
            onPointerDown={(event) => {
              if (event.pointerType === 'touch') {
                event.preventDefault();
                onMobilePointerDown(entry, event);
                return;
              }

              onPadPress(entry);
            }}
            sx={{
              position: 'relative',
              aspectRatio: '1 / 1',
              minHeight: { xs: 82, sm: 108 },
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: { xs: '0.88rem', sm: '1.02rem' },
              letterSpacing: 0.2,
              textTransform: 'none',
              color: 'common.white',
              background: isEditing
                ? appColors.surface.chordPadEditGradient
                : isActive
                  ? padStyles.active.bg
                  : padStyles.body.bg,
              backgroundColor: appColors.surface.chordPadDefaultBackground,
              border: '2px solid',
              borderColor: isEditing
                ? editingBorderColor
                : isActive
                  ? padStyles.active.border
                  : isCoFHighlighted
                    ? cofBorderColor
                    : borderColor,
              boxShadow: isEditing
                ? `0 0 0 2px ${appColors.surface.chordPadEditGlow}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                : isActive
                  ? `0 3px 0 ${appColors.surface.chordPadShadowPressed}`
                  : isCoFHighlighted
                    ? `0 0 0 3px ${cofGlowColor}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                    : `0 8px 0 ${appColors.surface.chordPadShadowRest}`,
              transform: isActive ? 'translateY(5px)' : 'translateY(0)',
              transition:
                'transform 90ms ease, box-shadow 90ms ease, background 120ms, border-color 120ms',
              '&:hover': {
                background: isEditing
                  ? appColors.surface.chordPadEditGradientHover
                  : isActive
                    ? padStyles.active.bg
                    : padStyles.body.bgHover,
                boxShadow: isEditing
                  ? `0 0 0 2px ${appColors.surface.chordPadEditGlowHover}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                  : isActive
                    ? `0 3px 0 ${appColors.surface.chordPadShadowPressed}`
                    : isCoFHighlighted
                      ? `0 0 0 4px ${cofGlowColor}, 0 8px 0 ${appColors.surface.chordPadShadowRest}`
                      : `0 8px 0 ${appColors.surface.chordPadShadowRest}`,
                borderColor: isEditing
                  ? editingBorderColor
                  : isActive
                    ? padStyles.active.border
                    : isCoFHighlighted
                      ? cofBorderColor
                      : borderColor,
              },
              '&:active': {
                transform: 'translateY(5px)',
                background: isEditing
                  ? appColors.surface.chordPadEditGradientActive
                  : isActive
                    ? padStyles.active.bg
                    : padStyles.body.bgHover,
                boxShadow: `0 3px 0 ${appColors.surface.chordPadShadowPressed}`,
              },
            }}
          >
            {showKeyboardHints && hotkeyLabel ? (
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  top: 6,
                  minWidth: 20,
                  height: 20,
                  px: 0.5,
                  borderRadius: 0.75,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: { xs: '0.64rem', sm: '0.68rem' },
                  fontWeight: 700,
                  lineHeight: 1,
                  color: theme.palette.common.white,
                  bgcolor: alpha(theme.palette.common.black, 0.36),
                  border: `1px solid ${alpha(theme.palette.common.white, 0.32)}`,
                  boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.3)}`,
                }}
                style={{ left: 6 }}
              >
                {hotkeyLabel}
              </Box>
            ) : null}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography
                component="span"
                sx={{ fontWeight: 700, fontSize: { xs: '0.88rem', sm: '1.02rem' } }}
              >
                {entry.chord}
              </Typography>
            </Box>
          </Button>
        );
      })}
    </Box>
  );
}
