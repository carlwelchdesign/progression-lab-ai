'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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

const SKILL_CHIP_COLOR: Record<SkillLevel, 'success' | 'warning' | 'error'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error',
};

type Props = {
  lesson: Lesson | null;
  onClose: () => void;
};

// ── Practice section ─────────────────────────────────────────────────────────

function PracticeSection({ chords }: { chords: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const handleSuccess = () => {
    if (currentIndex < chords.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setAllDone(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAllDone(false);
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Practice with MIDI
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Connect a MIDI keyboard and play each chord. The diagram shows the target notes — your
        keypresses light up alongside them.
      </Typography>

      {/* Progress bar */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={allDone ? 100 : (currentIndex / chords.length) * 100}
          sx={{ flex: 1, borderRadius: 1 }}
        />
        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
          {allDone ? chords.length : currentIndex} / {chords.length}
        </Typography>
      </Stack>

      {allDone ? (
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography variant="body2" color="success.main" fontWeight={600}>
            All chords complete — great work!
          </Typography>
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleRestart}
            variant="outlined"
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

function TextLessonContent({ lesson }: { lesson: Lesson }) {
  const { content } = lesson;
  if (!content) return null;

  return (
    <Stack spacing={3}>
      <Typography variant="body1" color="text.secondary">
        {content.intro}
      </Typography>

      <Divider />

      <Stack spacing={2.5}>
        {content.steps.map((step, index) => (
          <Box key={index}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {index + 1}. {step.heading}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step.body}
            </Typography>
            {step.tip ? (
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderLeft: 3,
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  borderRadius: '0 4px 4px 0',
                }}
              >
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  TIP{' '}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.tip}
                </Typography>
              </Box>
            ) : null}
          </Box>
        ))}
      </Stack>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {content.summary}
        </Typography>
      </Box>

      {content.relatedChords && content.relatedChords.length > 0 ? (
        <>
          <Divider />
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Hear these chords
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click the play button on any chord to hear how it sounds.
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

          <Divider />
          <PracticeSection chords={content.relatedChords} />
        </>
      ) : null}
    </Stack>
  );
}

export default function LessonDetailDialog({ lesson, onClose }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={lesson !== null}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      {lesson ? (
        <>
          <DialogTitle component={Stack} direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                sx={{ mb: 0.5 }}
              >
                <Chip
                  label={lesson.skillLevel}
                  size="small"
                  color={SKILL_CHIP_COLOR[lesson.skillLevel]}
                  variant="outlined"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    {lesson.durationMinutes} min
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="h6" fontWeight={700}>
                {lesson.title}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" aria-label="Close lesson">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            {lesson.component === 'cof' ? (
              <CircleOfFifthsLesson />
            ) : (
              <TextLessonContent lesson={lesson} />
            )}
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  );
}
