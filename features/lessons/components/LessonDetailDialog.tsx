'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { Lesson, SkillLevel } from '../types';
import TryInGeneratorButton from './TryInGeneratorButton';
import PlayableChordCard from './PlayableChordCard';
import CircleOfFifthsLesson from './CircleOfFifthsLesson';
import ChordMatchExercise from './ChordMatchExercise';

const SKILL_CONFIG: Record<SkillLevel, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: '#4ADE80' },
  intermediate: { label: 'Intermediate', color: '#F59E0B' },
  advanced: { label: 'Advanced', color: '#F43F5E' },
};

type Props = {
  lesson: Lesson | null;
  onClose: () => void;
  onComplete?: (lessonId: string) => void;
};

// ── Practice section ──────────────────────────────────────────────────────────

function PracticeSection({
  chords,
  onAllComplete,
}: {
  chords: string[];
  onAllComplete?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const handleSuccess = () => {
    if (currentIndex < chords.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setAllDone(true);
      onAllComplete?.();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAllDone(false);
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.07)',
        bgcolor: 'rgba(255,255,255,0.02)',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: '-0.01em', mb: 0.5 }}>
        MIDI Practice
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, opacity: 0.75 }}>
        Connect a MIDI keyboard and play each chord. The diagram shows the target notes — your
        keypresses light up alongside them.
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <LinearProgress
          variant="determinate"
          value={allDone ? 100 : (currentIndex / chords.length) * 100}
          sx={{
            flex: 1,
            borderRadius: 2,
            height: 5,
            bgcolor: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#4ADE80',
              borderRadius: 2,
            },
          }}
        />
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontSize: '0.72rem' }}
        >
          {allDone ? chords.length : currentIndex} / {chords.length}
        </Typography>
      </Stack>

      {allDone ? (
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography variant="body2" sx={{ color: '#4ADE80', fontWeight: 600 }}>
            All chords complete — great work!
          </Typography>
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleRestart}
            variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}
          >
            Practice again
          </Button>
        </Stack>
      ) : (
        <ChordMatchExercise
          key={chords[currentIndex]}
          chord={chords[currentIndex]}
          onSuccess={handleSuccess}
        />
      )}
    </Box>
  );
}

// ── Text lesson ───────────────────────────────────────────────────────────────

function TextLessonContent({ lesson, onComplete }: { lesson: Lesson; onComplete?: () => void }) {
  const { content } = lesson;
  if (!content) return null;

  return (
    <Stack spacing={0}>
      {/* Intro */}
      <Typography
        variant="body1"
        sx={{ color: 'text.secondary', lineHeight: 1.7, opacity: 0.85, mb: 3.5 }}
      >
        {content.intro}
      </Typography>

      {/* Steps */}
      <Stack spacing={0} sx={{ mb: 3.5 }}>
        {content.steps.map((step, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              pl: 3,
              pb: index < content.steps.length - 1 ? 3.5 : 0,
              // Vertical connector line
              '&::before':
                index < content.steps.length - 1
                  ? {
                      content: '""',
                      position: 'absolute',
                      left: '9px',
                      top: '26px',
                      bottom: 0,
                      width: '1px',
                      bgcolor: 'rgba(255,255,255,0.07)',
                    }
                  : {},
            }}
          >
            {/* Step number bubble */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: '2px',
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: 'text.disabled',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {index + 1}
              </Typography>
            </Box>

            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ mb: 0.75, lineHeight: 1.3, letterSpacing: '-0.01em' }}
            >
              {step.heading}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.65, opacity: 0.8 }}
            >
              {step.body}
            </Typography>

            {step.tip ? (
              <Box
                sx={{
                  mt: 1.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(96, 165, 250, 0.06)',
                  border: '1px solid rgba(96, 165, 250, 0.18)',
                  borderLeft: '3px solid',
                  borderLeftColor: '#60A5FA',
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#60A5FA',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    mr: 0.75,
                  }}
                >
                  Tip
                </Typography>
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6, opacity: 0.85 }}
                >
                  {step.tip}
                </Typography>
              </Box>
            ) : null}
          </Box>
        ))}
      </Stack>

      {/* Summary callout */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          mb: 3.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
            color: 'text.disabled',
            mb: 1,
            fontSize: '0.67rem',
          }}
        >
          Key Takeaway
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.65, fontStyle: 'italic', opacity: 0.85 }}
        >
          {content.summary}
        </Typography>
      </Box>

      {content.relatedChords && content.relatedChords.length > 0 ? (
        <>
          {/* Hear these chords */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: 'text.disabled',
                mb: 0.5,
                fontSize: '0.67rem',
              }}
            >
              Hear these chords
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, opacity: 0.7 }}>
              Click play on any chord to hear it.
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 1.5,
                mb: 2,
              }}
            >
              {content.relatedChords.map((chord) => (
                <PlayableChordCard key={chord} chord={chord} />
              ))}
            </Box>
            <TryInGeneratorButton chords={content.relatedChords} />
          </Box>

          <PracticeSection chords={content.relatedChords} onAllComplete={onComplete} />
        </>
      ) : null}
    </Stack>
  );
}

// ── Dialog ────────────────────────────────────────────────────────────────────

export default function LessonDetailDialog({ lesson, onClose, onComplete }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const skillConfig = lesson ? SKILL_CONFIG[lesson.skillLevel] : null;

  return (
    <Dialog
      open={lesson !== null}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        },
      }}
    >
      {lesson && skillConfig ? (
        <>
          <DialogTitle
            component="div"
            sx={{
              px: { xs: 2.5, sm: 3 },
              pt: 2.5,
              pb: 2,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              {/* Left accent bar */}
              <Box
                sx={{
                  width: 3,
                  alignSelf: 'stretch',
                  minHeight: 48,
                  borderRadius: 2,
                  bgcolor: skillConfig.color,
                  flexShrink: 0,
                  mt: 0.25,
                  opacity: 0.75,
                }}
              />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={0.625} alignItems="center">
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: skillConfig.color,
                        boxShadow: `0 0 8px ${skillConfig.color}99`,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: skillConfig.color,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        fontSize: '0.67rem',
                      }}
                    >
                      {skillConfig.label}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.45 }}>
                    <AccessTimeIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {lesson.durationMinutes} min
                    </Typography>
                  </Stack>
                </Stack>

                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
                >
                  {lesson.title}
                </Typography>
              </Box>

              <IconButton
                onClick={onClose}
                size="small"
                aria-label="Close lesson"
                sx={{ mt: -0.5, opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
            {lesson.component === 'cof' ? (
              <CircleOfFifthsLesson />
            ) : (
              <TextLessonContent
                lesson={lesson}
                onComplete={lesson.id ? () => onComplete?.(lesson.id) : undefined}
              />
            )}
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  );
}
