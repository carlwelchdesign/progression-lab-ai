'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useGeneratedCurriculum } from '../hooks/useGeneratedCurriculum';
import type { GeneratedLesson } from '../types';
import type { CourseLesson } from '../../course/data/courseContent';
import CourseLessonPlayer from '../../course/components/CourseLessonPlayer';
import { useLessonProgress } from '../../lessons/hooks/useLessonProgress';

// Adapt GeneratedLesson → CourseLesson (structurally identical, just needs cast)
function toCourseLessonArray(lessons: GeneratedLesson[]): CourseLesson[] {
  return lessons as unknown as CourseLesson[];
}

type Props = {
  slug: string;
};

export default function MusicianStylePage({ slug }: Props) {
  const router = useRouter();
  const { state, regenerate, acceptStale } = useGeneratedCurriculum(slug);
  const { markComplete } = useLessonProgress();
  const [activeLessonIdx, setActiveLessonIdx] = useState<number | null>(null);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state.phase === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (state.phase === 'error') {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{state.message}</Alert>
      </Container>
    );
  }

  if (state.phase === 'generating') {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Stack spacing={3} alignItems="center">
          <AutoAwesomeIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700}>
            Generating your {state.musician.displayName} curriculum…
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 420, textAlign: 'center' }}>
            Our AI is analysing {state.musician.displayName}&apos;s style and building a
            personalised lesson plan based on your skill level.
          </Typography>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  const { musician } = state;
  const lessons =
    state.phase === 'ready'
      ? toCourseLessonArray(state.curriculum.lessons)
      : toCourseLessonArray(state.cached.lessons);

  const intro =
    state.phase === 'ready' ? state.curriculum.musicianIntro : state.cached.musicianIntro;

  // ── Active lesson player ──────────────────────────────────────────────────
  if (activeLessonIdx !== null) {
    const lesson = lessons[activeLessonIdx];
    const isLast = activeLessonIdx === lessons.length - 1;

    const handleComplete = () => {
      void markComplete(lesson.id);
      if (!isLast) {
        setActiveLessonIdx(activeLessonIdx + 1);
      } else {
        setActiveLessonIdx(null);
      }
    };

    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <CourseLessonPlayer
          key={lesson.id}
          lesson={lesson}
          onComplete={handleComplete}
          onBack={() => setActiveLessonIdx(null)}
        />
      </Container>
    );
  }

  // ── Curriculum overview ───────────────────────────────────────────────────
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/styles')}
          sx={{ alignSelf: 'flex-start', ml: -0.5 }}
          color="inherit"
        >
          All musicians
        </Button>

        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {musician.displayName}
          </Typography>
          <Typography variant="subtitle1" color="text.disabled">
            {musician.genre} · {musician.era}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
            {intro}
          </Typography>
        </Box>

        {/* Stale banner */}
        {state.phase === 'stale' && (
          <Alert
            severity="info"
            action={
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={acceptStale}>
                  Use existing
                </Button>
                <Button size="small" startIcon={<RefreshIcon />} onClick={regenerate}>
                  Refresh
                </Button>
              </Stack>
            }
          >
            Improved lessons are available for {musician.displayName}.
          </Alert>
        )}

        {/* Lesson list */}
        <Stack spacing={1.5}>
          {lessons.map((lesson, idx) => (
            <Box
              key={lesson.id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
              onClick={() => setActiveLessonIdx(idx)}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Lesson {idx + 1}: {lesson.title}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    ~{lesson.estimatedMinutes} min ·{' '}
                    {lesson.steps.filter((s) => s.type === 'exercise').length} exercises
                  </Typography>
                </Box>
                <Button size="small" variant="outlined">
                  Start
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>

        {/* Regenerate */}
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={regenerate}
          color="inherit"
          sx={{ alignSelf: 'flex-start' }}
        >
          Regenerate curriculum
        </Button>
      </Stack>
    </Container>
  );
}
