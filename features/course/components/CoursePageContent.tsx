'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { COURSE_UNITS } from '../data/courseContent';
import type { CourseLesson, CourseUnit } from '../data/courseContent';
import { useLessonProgress } from '../../lessons/hooks/useLessonProgress';
import CourseLessonPlayer from './CourseLessonPlayer';

// ── Unit card ─────────────────────────────────────────────────────────────────

function UnitCard({
  unit,
  unitIndex,
  isCompleted,
  isUnlocked,
  completedCount,
  onLessonClick,
}: {
  unit: CourseUnit;
  unitIndex: number;
  isCompleted: (id: string) => boolean;
  isUnlocked: boolean;
  completedCount: number;
  onLessonClick: (lesson: CourseLesson) => void;
}) {
  const progress = (completedCount / unit.lessons.length) * 100;

  return (
    <Card variant="outlined" sx={{ opacity: isUnlocked ? 1 : 0.55 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Unit header */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box>
              <Chip
                label={`Unit ${unitIndex + 1}`}
                size="small"
                variant="outlined"
                color={completedCount === unit.lessons.length ? 'success' : 'default'}
                sx={{ mb: 0.75 }}
              />
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {unit.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {unit.description}
              </Typography>
            </Box>
            {!isUnlocked ? <LockIcon sx={{ color: 'text.disabled', flexShrink: 0 }} /> : null}
          </Stack>

          {/* Progress */}
          <Stack spacing={0.5}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ borderRadius: 1 }}
              color={completedCount === unit.lessons.length ? 'success' : 'primary'}
            />
            <Typography variant="caption" color="text.disabled">
              {completedCount} / {unit.lessons.length} lessons complete
            </Typography>
          </Stack>

          <Divider />

          {/* Lesson list */}
          <Stack spacing={1}>
            {unit.lessons.map((lesson, li) => {
              const done = isCompleted(lesson.id);
              // A lesson is playable if the unit is unlocked and all previous lessons in the unit are done
              const playable = isUnlocked && (li === 0 || isCompleted(unit.lessons[li - 1].id));

              return (
                <Card
                  key={lesson.id}
                  variant="outlined"
                  sx={{
                    bgcolor: 'action.hover',
                    opacity: playable ? 1 : 0.5,
                  }}
                >
                  <CardActionArea disabled={!playable} onClick={() => onLessonClick(lesson)}>
                    <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        {done ? (
                          <CheckCircleIcon
                            sx={{ color: 'success.main', fontSize: 20, flexShrink: 0 }}
                          />
                        ) : (
                          <PlayArrowIcon
                            sx={{
                              color: playable ? 'primary.main' : 'text.disabled',
                              fontSize: 20,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {lesson.title}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            ~{lesson.estimatedMinutes} min ·{' '}
                            {lesson.steps.filter((s) => s.type === 'exercise').length} exercises
                          </Typography>
                        </Box>
                        {!playable && !done ? (
                          <LockIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                        ) : null}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ALL_LESSONS: CourseLesson[] = COURSE_UNITS.flatMap((u) => u.lessons);

export default function CoursePageContent() {
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const { isCompleted, markComplete } = useLessonProgress();

  const handleLessonComplete = (lesson: CourseLesson) => {
    void markComplete(lesson.id);
    const idx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
    const next = idx >= 0 ? ALL_LESSONS[idx + 1] : undefined;
    setActiveLesson(next ?? null);
  };

  if (activeLesson) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <CourseLessonPlayer
          lesson={activeLesson}
          onComplete={() => handleLessonComplete(activeLesson)}
          onBack={() => setActiveLesson(null)}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <KeyboardIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700}>
              Piano Course
            </Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ maxWidth: 540 }}>
            A structured, progressive course that grows with you. Connect a MIDI keyboard for
            interactive exercises — or use the on-screen diagram to follow along.
          </Typography>
        </Box>

        {/* Overall progress */}
        {(() => {
          const totalLessons = COURSE_UNITS.reduce((n, u) => n + u.lessons.length, 0);
          const completedLessons = COURSE_UNITS.reduce(
            (n, u) => n + u.lessons.filter((l) => isCompleted(l.id)).length,
            0,
          );
          return (
            <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Your progress
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {completedLessons} / {totalLessons} lessons
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(completedLessons / totalLessons) * 100}
                    sx={{ borderRadius: 1, height: 8 }}
                  />
                  {completedLessons === 0 ? (
                    <Typography variant="caption" color="text.disabled">
                      Start with Unit 1 below. Complete each lesson to unlock the next.
                    </Typography>
                  ) : null}
                  {completedLessons > 0 && completedLessons < totalLessons ? (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                      onClick={() => {
                        // Find first incomplete lesson that's playable
                        for (const unit of COURSE_UNITS) {
                          for (let i = 0; i < unit.lessons.length; i++) {
                            if (!isCompleted(unit.lessons[i].id)) {
                              setActiveLesson(unit.lessons[i]);
                              return;
                            }
                          }
                        }
                      }}
                    >
                      Continue where you left off
                    </Button>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          );
        })()}

        {/* Units */}
        <Stack spacing={3}>
          {COURSE_UNITS.map((unit, ui) => {
            const completedCount = unit.lessons.filter((l) => isCompleted(l.id)).length;
            // Unit 0 is always unlocked; subsequent units unlock when the previous is complete
            const isUnlocked =
              ui === 0 || COURSE_UNITS[ui - 1].lessons.every((l) => isCompleted(l.id));

            return (
              <UnitCard
                key={unit.id}
                unit={unit}
                unitIndex={ui}
                isCompleted={isCompleted}
                isUnlocked={isUnlocked}
                completedCount={completedCount}
                onLessonClick={setActiveLesson}
              />
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}
