'use client';

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { Lesson, SkillLevel } from '../types';
import TryInGeneratorButton from './TryInGeneratorButton';
import CircleOfFifthsLesson from './CircleOfFifthsLesson';

const SKILL_CHIP_COLOR: Record<SkillLevel, 'success' | 'warning' | 'error'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error',
};

type Props = {
  lesson: Lesson | null;
  onClose: () => void;
};

function TextLessonContent({ lesson }: { lesson: Lesson }) {
  const { content } = lesson;
  if (!content) return null;

  return (
    <Stack spacing={3}>
      <Typography variant="body1" color="text.secondary">
        {content.intro}
      </Typography>

      <Divider />

      <Stack spacing={2.5}>
        {content.steps.map((step, index) => (
          <Box key={index}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {index + 1}. {step.heading}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step.body}
            </Typography>
            {step.tip ? (
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderLeft: 3,
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  borderRadius: '0 4px 4px 0',
                }}
              >
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  TIP{' '}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.tip}
                </Typography>
              </Box>
            ) : null}
          </Box>
        ))}
      </Stack>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {content.summary}
        </Typography>
      </Box>

      {content.relatedChords && content.relatedChords.length > 0 ? (
        <Box>
          <TryInGeneratorButton chords={content.relatedChords} />
        </Box>
      ) : null}
    </Stack>
  );
}

export default function LessonDetailDialog({ lesson, onClose }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={lesson !== null}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      {lesson ? (
        <>
          <DialogTitle component={Stack} direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                sx={{ mb: 0.5 }}
              >
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
              </Stack>
              <Typography variant="h6" fontWeight={700}>
                {lesson.title}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" aria-label="Close lesson">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            {lesson.component === 'cof' ? (
              <CircleOfFifthsLesson />
            ) : (
              <TextLessonContent lesson={lesson} />
            )}
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  );
}
