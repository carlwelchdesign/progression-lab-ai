'use client';

import { useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { LESSONS_BY_SKILL } from '../data/lessonContent';
import type { Lesson, SkillLevel } from '../types';
import LessonSkillTabs from './LessonSkillTabs';
import LessonDetailDialog from './LessonDetailDialog';

export default function LessonsPageContent() {
  const [activeSkill, setActiveSkill] = useState<SkillLevel>('beginner');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Music Lessons
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
            Learn harmony and music theory at your own pace — from chord basics to advanced
            reharmonisation techniques.
          </Typography>
        </Box>

        <LessonSkillTabs
          activeSkill={activeSkill}
          lessonsBySkill={LESSONS_BY_SKILL}
          onSkillChange={setActiveSkill}
          onLessonClick={setSelectedLesson}
        />
      </Stack>

      <LessonDetailDialog lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
    </Container>
  );
}
