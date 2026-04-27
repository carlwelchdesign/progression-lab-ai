'use client';

import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ChordSuggestion, SuggestionCategory } from '../types';
import ChordSuggestionCard from './ChordSuggestionCard';

type CategoryConfig = {
  label: string;
  description: string;
  defaultExpanded: boolean;
};

const CATEGORIES: Record<SuggestionCategory, CategoryConfig> = {
  diatonic: {
    label: 'Safe / Diatonic',
    description: 'Chords that naturally live in the key',
    defaultExpanded: true,
  },
  tension: {
    label: 'Tension',
    description: 'Chords that add harmonic tension and pull',
    defaultExpanded: false,
  },
  resolution: {
    label: 'Resolution',
    description: 'Chords that resolve tension and feel like home',
    defaultExpanded: false,
  },
  color: {
    label: 'Color / Borrowed',
    description: 'Modal mixture and borrowed chords for colour',
    defaultExpanded: false,
  },
  jazzy: {
    label: 'Jazzy / Advanced',
    description: 'ii-V-I moves, tritone subs, and chord subs',
    defaultExpanded: false,
  },
};

const CATEGORY_ORDER: SuggestionCategory[] = [
  'diatonic',
  'resolution',
  'tension',
  'color',
  'jazzy',
];

type Props = {
  suggestions: ChordSuggestion[];
  liveChordName?: string | null;
};

export default function SuggestionGrid({ suggestions, liveChordName }: Props) {
  if (suggestions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
        <Typography variant="body2">
          Suggestions will appear once you play and hold a chord
        </Typography>
      </Box>
    );
  }

  const grouped = new Map<SuggestionCategory, ChordSuggestion[]>();
  for (const s of suggestions) {
    const list = grouped.get(s.category) ?? [];
    list.push(s);
    grouped.set(s.category, list);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => {
        const config = CATEGORIES[cat];
        const items = grouped.get(cat) ?? [];

        return (
          <Accordion
            key={cat}
            defaultExpanded={config.defaultExpanded}
            disableGutters
            elevation={0}
            square
            sx={{
              background: 'transparent',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { mb: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
              sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 0.75 } }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {config.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {config.description}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, px: 1.5, pb: 1.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  },
                  gap: 1.5,
                }}
              >
                {items.map((suggestion) => (
                  <ChordSuggestionCard
                    key={`${cat}-${suggestion.name}`}
                    suggestion={suggestion}
                    isBeingPlayed={!!liveChordName && liveChordName === suggestion.name}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
