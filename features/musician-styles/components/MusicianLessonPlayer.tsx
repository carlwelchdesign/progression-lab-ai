'use client';

import { useState } from 'react';
import { Alert, Box, Button, Chip, Container, Divider, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import type { CourseLesson, CourseLessonStep } from '../../course/data/courseContent';
import ChordMatchExercise from '../../lessons/components/ChordMatchExercise';

// ── Exercise block ────────────────────────────────────────────────────────────

function ExerciseBlock({
  step,
  done,
  onDone,
}: {
  step: Extract<CourseLessonStep, { type: 'exercise' }>;
  done: boolean;
  onDone: () => void;
}) {
  const { exercise } = step;
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: done ? 'success.main' : 'divider',
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Exercise header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: done ? 'success.main' : 'action.hover',
          transition: 'background-color 0.3s',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <MusicNoteIcon
            sx={{ fontSize: 15, color: done ? 'success.contrastText' : 'text.secondary' }}
          />
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              color: done ? 'success.contrastText' : 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Exercise
          </Typography>
        </Stack>
        {done && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.contrastText' }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: 'success.contrastText' }}>
              Done
            </Typography>
          </Stack>
        )}
      </Stack>

      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: exercise.hint ? 1 : 1.5 }}>
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
              mb: 1.5,
            }}
          >
            <KeyboardIcon sx={{ fontSize: 15, color: 'warning.main', mt: 0.15, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary">
              {exercise.hint}
            </Typography>
          </Box>
        ) : null}

        {done ? (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ py: 0.5 }}>
            Nailed it — keep scrolling.
          </Alert>
        ) : (
          <ChordMatchExercise
            chord={exercise.chord}
            targetNotes={exercise.targetNotes}
            onSuccess={onDone}
          />
        )}
      </Box>
    </Box>
  );
}

// ── Text block ────────────────────────────────────────────────────────────────

function TextBlock({ step }: { step: Extract<CourseLessonStep, { type: 'text' }> }) {
  return (
    <Stack spacing={1.5}>
      {step.heading ? (
        <Typography variant="subtitle1" fontWeight={700}>
          {step.heading}
        </Typography>
      ) : null}
      {step.body ? (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
          {step.body}
        </Typography>
      ) : null}
      {step.tip ? (
        <Box
          sx={{
            p: 1.5,
            borderLeft: 3,
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
            borderRadius: '0 6px 6px 0',
          }}
        >
          <Typography variant="caption" color="primary.main" fontWeight={700}>
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

// ── Completion screen ─────────────────────────────────────────────────────────

function LessonComplete({
  lessonTitle,
  musicianName,
  isLast,
  onNext,
  onBack,
}: {
  lessonTitle: string;
  musicianName: string;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Stack spacing={3} alignItems="center" sx={{ py: 8, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Lesson complete
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {lessonTitle}
        </Typography>
      </Box>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack} color="inherit">
          Back to {musicianName}
        </Button>
        {!isLast && (
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={onNext}>
            Next Lesson
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  lesson: CourseLesson;
  lessonNumber: number;
  totalLessons: number;
  musicianName: string;
  isLast: boolean;
  onComplete: () => void;
  onNext: () => void;
  onBack: () => void;
};

export default function MusicianLessonPlayer({
  lesson,
  lessonNumber,
  totalLessons,
  musicianName,
  isLast,
  onComplete,
  onNext,
  onBack,
}: Props) {
  const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const exercises = lesson.steps.filter((s) => s.type === 'exercise');
  const totalExercises = exercises.length;
  const doneCount = completedExerciseIds.size;
  const allDone = totalExercises === 0 || doneCount >= totalExercises;

  const handleExerciseDone = (exerciseId: string) => {
    setCompletedExerciseIds((prev) => new Set(prev).add(exerciseId));
  };

  const handleComplete = () => {
    setFinished(true);
    onComplete();
  };

  if (finished) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <LessonComplete
          lessonTitle={lesson.title}
          musicianName={musicianName}
          isLast={isLast}
          onNext={onNext}
          onBack={onBack}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, pb: { xs: 12, md: 14 } }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mb: 1.5, ml: -0.5 }}
            color="inherit"
          >
            {musicianName}
          </Button>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Typography variant="h5" fontWeight={700}>
              {lesson.title}
            </Typography>
            <Chip
              label={`Lesson ${lessonNumber} of ${totalLessons}`}
              size="small"
              variant="outlined"
            />
          </Stack>
          {totalExercises > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {doneCount} of {totalExercises} exercise{totalExercises !== 1 ? 's' : ''} complete
            </Typography>
          )}
        </Box>

        <Divider />

        {/* All steps rendered inline */}
        <Stack spacing={3}>
          {lesson.steps.map((step, idx) => {
            if (step.type === 'text') {
              return <TextBlock key={idx} step={step} />;
            }
            const done = completedExerciseIds.has(step.exercise.id);
            return (
              <ExerciseBlock
                key={step.exercise.id}
                step={step}
                done={done}
                onDone={() => handleExerciseDone(step.exercise.id)}
              />
            );
          })}
        </Stack>
      </Stack>

      {/* Sticky footer CTA */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 10,
        }}
      >
        <Button
          variant="contained"
          size="large"
          endIcon={<CheckCircleIcon />}
          onClick={handleComplete}
          disabled={!allDone}
          sx={{ minWidth: 180 }}
        >
          {allDone ? 'Complete Lesson' : `${doneCount} / ${totalExercises} exercises done`}
        </Button>
      </Box>
    </Container>
  );
}
