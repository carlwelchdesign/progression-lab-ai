'use client';

import { Box, ButtonBase, Grid, Stack, Typography } from '@mui/material';
import type { Lesson, SkillLevel } from '../types';
import LessonCard from './LessonCard';

const TABS: { value: SkillLevel; label: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', color: '#4ADE80' },
  { value: 'intermediate', label: 'Intermediate', color: '#F59E0B' },
  { value: 'advanced', label: 'Advanced', color: '#F43F5E' },
];

type Props = {
  activeSkill: SkillLevel;
  lessonsBySkill: Record<SkillLevel, Lesson[]>;
  onSkillChange: (skill: SkillLevel) => void;
  onLessonClick: (lesson: Lesson) => void;
  isCompleted: (lessonId: string) => boolean;
};

export default function LessonSkillTabs({
  activeSkill,
  lessonsBySkill,
  onSkillChange,
  onLessonClick,
  isCompleted,
}: Props) {
  const lessons = lessonsBySkill[activeSkill];

  return (
    <Box>
      {/* Segmented pill control */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          mb: 3,
          p: 0.5,
          bgcolor: 'rgba(255,255,255,0.03)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'inline-flex',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeSkill === tab.value;
          const count = lessonsBySkill[tab.value].length;
          const completedCount = lessonsBySkill[tab.value].filter((l) => isCompleted(l.id)).length;

          return (
            <ButtonBase
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSkillChange(tab.value)}
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: 0.875,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                transition: 'all 0.15s ease',
                bgcolor: isActive ? `${tab.color}14` : 'transparent',
                border: '1px solid',
                borderColor: isActive ? `${tab.color}44` : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? `${tab.color}1C` : 'rgba(255,255,255,0.04)',
                },
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: tab.color,
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.3,
                  boxShadow: isActive ? `0 0 6px ${tab.color}` : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? tab.color : 'text.secondary',
                  transition: 'color 0.15s ease',
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isActive ? tab.color : 'text.disabled',
                  opacity: isActive ? 0.65 : 0.4,
                  fontWeight: 500,
                  fontSize: '0.68rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {completedCount > 0 ? `${completedCount}/${count}` : count}
              </Typography>
            </ButtonBase>
          );
        })}
      </Stack>

      {lessons.length === 0 ? (
        <Typography color="text.secondary">No lessons yet for this level.</Typography>
      ) : (
        <Grid container spacing={2}>
          {lessons.map((lesson) => (
            <Grid key={lesson.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <LessonCard
                lesson={lesson}
                onClick={onLessonClick}
                completed={isCompleted(lesson.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
