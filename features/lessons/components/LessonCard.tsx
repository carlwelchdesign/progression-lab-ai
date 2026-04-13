'use client';

import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { Lesson, SkillLevel } from '../types';

const SKILL_CONFIG: Record<SkillLevel, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: '#4ADE80' },
  intermediate: { label: 'Intermediate', color: '#F59E0B' },
  advanced: { label: 'Advanced', color: '#F43F5E' },
};

type Props = {
  lesson: Lesson;
  onClick: (lesson: Lesson) => void;
  completed?: boolean;
};

export default function LessonCard({ lesson, onClick, completed = false }: Props) {
  const { color, label } = SKILL_CONFIG[lesson.skillLevel];

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: completed ? `${color}33` : 'rgba(255,255,255,0.07)',
        background: 'var(--app-card-bg)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
        '&:hover': {
          borderColor: `${color}55`,
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 24px ${color}14`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: color,
          opacity: completed ? 0.9 : 0.4,
          transition: 'opacity 0.2s ease',
        },
        '&:hover::before': {
          opacity: 0.85,
        },
      }}
    >
      <CardActionArea
        onClick={() => onClick(lesson)}
        sx={{ height: '100%', alignItems: 'flex-start' }}
      >
        <CardContent
          component={Stack}
          spacing={1.5}
          sx={{ height: '100%', pl: 2.5, pr: 2, pt: 2, pb: '16px !important' }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: color,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${color}88`,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '0.67rem',
                }}
              >
                {label}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.55 }}>
              {completed ? (
                <CheckCircleOutlineIcon sx={{ fontSize: 14, color, opacity: 1.6 }} />
              ) : null}
              <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                {lesson.durationMinutes}m
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ letterSpacing: '-0.015em', lineHeight: 1.25, color: 'text.primary' }}
          >
            {lesson.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.55, opacity: 0.75, flex: 1 }}
          >
            {lesson.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
