'use client';

import { Box, Typography } from '@mui/material';

import Card from '../ui/Card';
import type { ChordSuggestionResponse } from '../../lib/types';

type StructureSuggestionsSectionProps = {
  structureSuggestions: ChordSuggestionResponse['structureSuggestions'];
  showTitle?: boolean;
};

export default function StructureSuggestionsSection({
  structureSuggestions,
  showTitle = true,
}: StructureSuggestionsSectionProps) {
  return (
    <Box component="section" id="structure">
      {showTitle ? (
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Structure suggestions
        </Typography>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {structureSuggestions.map((section) => (
          <Card key={`${section.section}-${section.bars}`}>
            <Typography variant="h6" component="h3" gutterBottom>
              {section.section} · {section.bars} bars
            </Typography>
            <Typography variant="body2">{section.harmonicIdea}</Typography>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
