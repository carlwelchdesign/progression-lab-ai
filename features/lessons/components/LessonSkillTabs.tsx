'use client';

import { Box, Grid, Tab, Tabs, Typography } from '@mui/material';
import type { Lesson, SkillLevel } from '../types';
import LessonCard from './LessonCard';

const TABS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

type Props = {
  activeSkill: SkillLevel;
  lessonsBySkill: Record<SkillLevel, Lesson[]>;
  onSkillChange: (skill: SkillLevel) => void;
  onLessonClick: (lesson: Lesson) => void;
};

export default function LessonSkillTabs({
  activeSkill,
  lessonsBySkill,
  onSkillChange,
  onLessonClick,
}: Props) {
  const lessons = lessonsBySkill[activeSkill];

  return (
    <Box>
      <Tabs
        value={activeSkill}
        onChange={(_e, value: SkillLevel) => onSkillChange(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {lessons.length === 0 ? (
        <Typography color="text.secondary">No lessons yet for this level.</Typography>
      ) : (
        <Grid container spacing={2}>
          {lessons.map((lesson) => (
            <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <LessonCard lesson={lesson} onClick={onLessonClick} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
