'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useGeneratedCurriculum } from '../hooks/useGeneratedCurriculum';
import type { GeneratedLesson } from '../types';
import type { CourseLesson } from '../../course/data/courseContent';
import MusicianLessonPlayer from './MusicianLessonPlayer';
import { useLessonProgress } from '../../lessons/hooks/useLessonProgress';

function toCourseLessonArray(lessons: GeneratedLesson[]): CourseLesson[] {
  return lessons as unknown as CourseLesson[];
}

type Props = {
  slug: string;
};

export default function MusicianStylePage({ slug }: Props) {
  const router = useRouter();
  const { state, regenerate, acceptStale } = useGeneratedCurriculum(slug);
  const { isCompleted, markComplete } = useLessonProgress();
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
            Analysing {state.musician.displayName}&apos;s style and building a personalised lesson
            plan based on your skill level.
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

  const completedCount = lessons.filter((l) => isCompleted(l.id)).length;
  const firstIncompleteIdx = lessons.findIndex((l) => !isCompleted(l.id));

  // ── Active lesson player ──────────────────────────────────────────────────
  if (activeLessonIdx !== null) {
    const lesson = lessons[activeLessonIdx];
    const isLast = activeLessonIdx === lessons.length - 1;

    return (
      <MusicianLessonPlayer
        key={lesson.id}
        lesson={lesson}
        lessonNumber={activeLessonIdx + 1}
        totalLessons={lessons.length}
        musicianName={musician.displayName}
        isLast={isLast}
        onComplete={() => void markComplete(lesson.id)}
        onNext={() => setActiveLessonIdx(activeLessonIdx + 1)}
        onBack={() => setActiveLessonIdx(null)}
      />
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

        {/* Progress summary */}
        {completedCount > 0 && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
            <Typography variant="body2" color="text.secondary">
              {completedCount} of {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} complete
            </Typography>
          </Stack>
        )}

        {/* Stale banner */}
        {state.phase === 'stale' && (
          <Alert
            severity="info"
            action={
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={acceptStale}>
                  Keep existing
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
          {lessons.map((lesson, idx) => {
            const done = isCompleted(lesson.id);
            const isCurrent = idx === firstIncompleteIdx;
            const exerciseCount = lesson.steps.filter((s) => s.type === 'exercise').length;

            return (
              <Box
                key={lesson.id}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: isCurrent ? 'primary.main' : done ? 'success.main' : 'divider',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: isCurrent ? 'action.hover' : 'transparent',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  transition: 'border-color 0.2s, background-color 0.2s',
                }}
                onClick={() => setActiveLessonIdx(idx)}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                    {done ? (
                      <CheckCircleIcon
                        sx={{ fontSize: 20, color: 'success.main', flexShrink: 0 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: isCurrent ? 'primary.main' : 'divider',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={isCurrent ? 'primary.main' : 'text.disabled'}
                        >
                          {idx + 1}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {lesson.title}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        ~{lesson.estimatedMinutes} min · {exerciseCount} exercise
                        {exerciseCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    size="small"
                    variant={isCurrent ? 'contained' : 'outlined'}
                    color={done ? 'inherit' : 'primary'}
                    sx={{ flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLessonIdx(idx);
                    }}
                  >
                    {done ? 'Review' : isCurrent ? 'Continue' : 'Start'}
                  </Button>
                </Stack>
              </Box>
            );
          })}
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
