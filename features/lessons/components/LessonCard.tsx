'use client';

import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Lesson, SkillLevel } from '../types';

const SKILL_CHIP_COLOR: Record<SkillLevel, 'success' | 'warning' | 'error'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error',
};

type Props = {
  lesson: Lesson;
  onClick: (lesson: Lesson) => void;
  completed?: boolean;
};

export default function LessonCard({ lesson, onClick, completed = false }: Props) {
  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', ...(completed && { borderColor: 'success.main', opacity: 0.9 }) }}
    >
      <CardActionArea
        onClick={() => onClick(lesson)}
        sx={{ height: '100%', alignItems: 'flex-start' }}
      >
        <CardContent component={Stack} spacing={1.5} sx={{ height: '100%' }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
            {completed ? (
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', ml: 'auto' }} />
            ) : null}
          </Stack>
          <Typography variant="subtitle1" fontWeight={600}>
            {lesson.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lesson.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
