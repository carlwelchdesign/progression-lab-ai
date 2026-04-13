'use client';

import { useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { LESSONS, LESSONS_BY_SKILL } from '../data/lessonContent';
import type { Lesson, SkillLevel } from '../types';
import { useLessonProgress } from '../hooks/useLessonProgress';
import LessonSkillTabs from './LessonSkillTabs';
import LessonDetailDialog from './LessonDetailDialog';

export default function LessonsPageContent() {
  const [activeSkill, setActiveSkill] = useState<SkillLevel>('beginner');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const { isCompleted, markComplete } = useLessonProgress();

  const completedCount = LESSONS.filter((l) => isCompleted(l.id)).length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: 'primary.main',
              letterSpacing: '0.1em',
              fontWeight: 600,
              fontSize: '0.68rem',
              mb: 0.75,
              display: 'block',
              opacity: 0.85,
            }}
          >
            Music Theory
          </Typography>

          <Stack direction="row" alignItems="baseline" spacing={2} flexWrap="wrap" useFlexGap>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              Lessons
            </Typography>
            {completedCount > 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: '#4ADE80',
                  fontWeight: 500,
                  opacity: 0.8,
                  fontSize: '0.875rem',
                }}
              >
                {completedCount} / {LESSONS.length} complete
              </Typography>
            )}
          </Stack>

          <Typography
            color="text.secondary"
            sx={{ mt: 1.5, maxWidth: 500, lineHeight: 1.65, opacity: 0.75 }}
          >
            From chord basics to advanced reharmonisation — learn harmony at your own pace.
          </Typography>
        </Box>

        <LessonSkillTabs
          activeSkill={activeSkill}
          lessonsBySkill={LESSONS_BY_SKILL}
          onSkillChange={setActiveSkill}
          onLessonClick={setSelectedLesson}
          isCompleted={isCompleted}
        />
      </Stack>

      <LessonDetailDialog
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onComplete={(lessonId) => void markComplete(lessonId)}
      />
    </Container>
  );
}
