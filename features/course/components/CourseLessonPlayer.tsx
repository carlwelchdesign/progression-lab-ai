'use client';

import { useState } from 'react';
import { Box, Button, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import type { CourseLesson, CourseLessonStep } from '../data/courseContent';
import ChordMatchExercise from '../../lessons/components/ChordMatchExercise';

// ── Step renderer ─────────────────────────────────────────────────────────────

function StepView({
  step,
  onExerciseSuccess,
}: {
  step: CourseLessonStep;
  onExerciseSuccess: () => void;
}) {
  if (step.type === 'text') {
    return (
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          {step.heading}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {step.body}
        </Typography>
        {step.tip ? (
          <Box
            sx={{
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
      </Stack>
    );
  }

  const { exercise } = step;
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" fontWeight={600}>
        {exercise.prompt}
      </Typography>
      {exercise.hint ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            p: 1.25,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'warning.main',
          }}
        >
          <KeyboardIcon sx={{ fontSize: 15, color: 'warning.main', mt: 0.2, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary">
            {exercise.hint}
          </Typography>
        </Box>
      ) : null}
      <ChordMatchExercise
        chord={exercise.chord}
        targetNotes={exercise.targetNotes}
        onSuccess={onExerciseSuccess}
      />
    </Stack>
  );
}

// ── Lesson player ─────────────────────────────────────────────────────────────

type Props = {
  lesson: CourseLesson;
  onComplete: () => void;
  onBack: () => void;
};

export default function CourseLessonPlayer({ lesson, onComplete, onBack }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [exerciseDoneSteps, setExerciseDoneSteps] = useState<Set<number>>(new Set());

  const step = lesson.steps[stepIndex];
  const isLast = stepIndex === lesson.steps.length - 1;
  const progress =
    ((stepIndex + (exerciseDoneSteps.has(stepIndex) ? 1 : 0)) / lesson.steps.length) * 100;

  const isStepDone = step.type === 'text' || exerciseDoneSteps.has(stepIndex);

  const handleExerciseSuccess = () => {
    setExerciseDoneSteps((prev) => new Set(prev).add(stepIndex));
    const isLastStep = stepIndex === lesson.steps.length - 1;
    setTimeout(() => {
      if (isLastStep) {
        onComplete();
      } else {
        setStepIndex((i) => i + 1);
      }
    }, 1200);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 640, mx: 'auto' }}>
      {/* Header */}
      <Box>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mb: 1, ml: -0.5 }}
          color="inherit"
        >
          Back to course
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {lesson.title}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Step {stepIndex + 1} of {lesson.steps.length}
        </Typography>
      </Box>

      {/* Progress bar */}
      <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 6 }} />

      <Divider />

      {/* Current step */}
      <StepView step={step} onExerciseSuccess={handleExerciseSuccess} />

      {/* Navigation */}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        {stepIndex > 0 ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => setStepIndex((i) => i - 1)}
          >
            Previous
          </Button>
        ) : null}
        <Button
          variant="contained"
          size="small"
          endIcon={isLast ? <CheckCircleOutlineIcon /> : <ArrowForwardIcon />}
          onClick={handleNext}
          disabled={!isStepDone}
        >
          {isLast ? 'Complete lesson' : 'Next'}
        </Button>
      </Stack>
    </Stack>
  );
}
