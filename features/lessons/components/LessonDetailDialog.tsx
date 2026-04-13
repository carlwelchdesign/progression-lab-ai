'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { Lesson, SkillLevel } from '../types';
import TryInGeneratorButton from './TryInGeneratorButton';
import PlayableChordCard from './PlayableChordCard';
import CircleOfFifthsLesson from './CircleOfFifthsLesson';
import ChordMatchExercise from './ChordMatchExercise';

const SKILL_CONFIG: Record<SkillLevel, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: '#4ADE80' },
  intermediate: { label: 'Intermediate', color: '#F59E0B' },
  advanced: { label: 'Advanced', color: '#F43F5E' },
};

type Props = {
  lesson: Lesson | null;
  onClose: () => void;
  onComplete?: (lessonId: string) => void;
};

// ── Step-based lesson content ─────────────────────────────────────────────────

function TextLessonContent({ lesson, onComplete }: { lesson: Lesson; onComplete?: () => void }) {
  const theme = useTheme();
  const { content } = lesson;
  const [currentStep, setCurrentStep] = useState(0);
  const [stepsDone, setStepsDone] = useState<Set<number>>(new Set());

  if (!content) return null;

  const totalSteps = content.steps.length;
  const isSummaryView = currentStep === totalSteps; // one past the last step = summary
  const step = content.steps[currentStep];
  const chordForStep = content.relatedChords?.[currentStep];

  const markStepDone = (i: number) => setStepsDone((prev) => new Set([...prev, i]));

  const goNext = () => {
    markStepDone(currentStep);
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
    if (currentStep === totalSteps - 1) {
      // entering summary view
    }
    if (currentStep === totalSteps) {
      onComplete?.();
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <Stack spacing={0} sx={{ minHeight: 0 }}>
      {/* ── Progress dots ── */}
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        justifyContent="center"
        sx={{ mb: 3 }}
      >
        {content.steps.map((_, i) => {
          const active = i === currentStep;
          const done = stepsDone.has(i) || isSummaryView;
          return (
            <Box
              key={i}
              onClick={() => setCurrentStep(i)}
              sx={{
                width: active ? 20 : 7,
                height: 7,
                borderRadius: 4,
                bgcolor: done
                  ? '#4ADE8077'
                  : active
                    ? theme.palette.primary.main
                    : 'rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                flexShrink: 0,
                border: active ? '1.5px solid' : '1.5px solid transparent',
                borderColor: active ? theme.palette.primary.main : 'transparent',
              }}
            />
          );
        })}
        {/* Summary dot */}
        <Box
          onClick={() => setCurrentStep(totalSteps)}
          sx={{
            width: isSummaryView ? 20 : 7,
            height: 7,
            borderRadius: 4,
            bgcolor: isSummaryView ? theme.palette.primary.main : 'rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            flexShrink: 0,
          }}
        />
      </Stack>

      {/* ── Intro (step 0 only) ── */}
      {currentStep === 0 && !isSummaryView && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2.5, lineHeight: 1.7, opacity: 0.8, fontStyle: 'italic' }}
        >
          {content.intro}
        </Typography>
      )}

      {/* ── Current step or summary ── */}
      {isSummaryView ? (
        <SummaryView lesson={lesson} onComplete={onComplete} />
      ) : (
        <Stack spacing={2.5}>
          {/* Step heading */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                fontWeight: 700,
                color: 'text.disabled',
                fontSize: '0.66rem',
                mb: 0.75,
              }}
            >
              Step {currentStep + 1} of {totalSteps}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ letterSpacing: '-0.02em', lineHeight: 1.2, mb: 1 }}
            >
              {step.heading}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.7, opacity: 0.85 }}
            >
              {step.body}
            </Typography>
          </Box>

          {/* Tip / Try this */}
          {step.tip && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 1.5,
                bgcolor: 'rgba(96,165,250,0.06)',
                border: '1px solid rgba(96,165,250,0.18)',
                borderLeft: '3px solid #60A5FA',
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  color: '#60A5FA',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  mr: 0.75,
                }}
              >
                Try this:
              </Typography>
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                {step.tip}
              </Typography>
            </Box>
          )}

          {/* Chord exercise for this step */}
          {chordForStep && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.07)',
                bgcolor: 'rgba(0,0,0,0.15)',
              }}
            >
              <ChordMatchExercise
                key={`${lesson.id}-step${currentStep}`}
                chord={chordForStep}
                onSuccess={() => markStepDone(currentStep)}
              />
            </Box>
          )}
        </Stack>
      )}

      {/* ── Navigation ── */}
      {!isSummaryView && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 3, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
            onClick={goBack}
            disabled={currentStep === 0}
            size="small"
            sx={{ color: 'text.secondary', opacity: currentStep === 0 ? 0.3 : 0.7 }}
          >
            Back
          </Button>

          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
            onClick={goNext}
            size="small"
            disableElevation
            sx={{ fontWeight: 700, letterSpacing: '0.02em' }}
          >
            {currentStep === totalSteps - 1 ? 'Wrap up' : 'Continue'}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

// ── Summary view (after all steps) ────────────────────────────────────────────

function SummaryView({ lesson, onComplete }: { lesson: Lesson; onComplete?: () => void }) {
  const { content } = lesson;
  if (!content) return null;

  return (
    <Stack spacing={3}>
      {/* Key takeaway */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
            color: 'text.disabled',
            mb: 1,
            fontSize: '0.66rem',
          }}
        >
          Key Takeaway
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7, fontStyle: 'italic', opacity: 0.85 }}
        >
          {content.summary}
        </Typography>
      </Box>

      {/* Hear all chords */}
      {content.relatedChords && content.relatedChords.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              fontWeight: 700,
              color: 'text.disabled',
              fontSize: '0.66rem',
              mb: 1.5,
            }}
          >
            All chords from this lesson
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 1.5,
              mb: 2,
            }}
          >
            {content.relatedChords.map((chord) => (
              <PlayableChordCard key={chord} chord={chord} />
            ))}
          </Box>
          <TryInGeneratorButton chords={content.relatedChords} />
        </Box>
      )}

      {/* Complete lesson */}
      <Button
        variant="contained"
        fullWidth
        onClick={onComplete}
        disableElevation
        sx={{ py: 1.25, fontWeight: 700, letterSpacing: '0.03em' }}
      >
        Mark complete
      </Button>
    </Stack>
  );
}

// ── Dialog shell ──────────────────────────────────────────────────────────────

export default function LessonDetailDialog({ lesson, onClose, onComplete }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const skillConfig = lesson ? SKILL_CONFIG[lesson.skillLevel] : null;

  return (
    <Dialog
      open={lesson !== null}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: { sx: { bgcolor: 'background.paper', backgroundImage: 'none' } },
      }}
    >
      {lesson && skillConfig ? (
        <>
          <DialogTitle
            component="div"
            sx={{
              px: { xs: 2.5, sm: 3 },
              pt: 2.5,
              pb: 2,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              <Box
                sx={{
                  width: 3,
                  alignSelf: 'stretch',
                  minHeight: 44,
                  borderRadius: 2,
                  bgcolor: skillConfig.color,
                  flexShrink: 0,
                  mt: 0.25,
                  opacity: 0.7,
                }}
              />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={0.625} alignItems="center">
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: skillConfig.color,
                        boxShadow: `0 0 7px ${skillConfig.color}88`,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: skillConfig.color,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        fontSize: '0.67rem',
                      }}
                    >
                      {skillConfig.label}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.4 }}>
                    <AccessTimeIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {lesson.durationMinutes} min
                    </Typography>
                  </Stack>
                </Stack>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
                >
                  {lesson.title}
                </Typography>
              </Box>

              <IconButton
                onClick={onClose}
                size="small"
                aria-label="Close lesson"
                sx={{ mt: -0.5, opacity: 0.5, '&:hover': { opacity: 1 } }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
            {lesson.component === 'cof' ? (
              <CircleOfFifthsLesson />
            ) : (
              <TextLessonContent
                key={lesson.id}
                lesson={lesson}
                onComplete={lesson.id ? () => onComplete?.(lesson.id) : undefined}
              />
            )}
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  );
}
