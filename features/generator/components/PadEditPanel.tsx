'use client';

import { Box, Button, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

import SelectField from '../../../components/ui/SelectField';

type PadEditPanelProps = {
  editingPadKey: string | null;
  editingChord: string;
  editableChordOptions: Array<{ value: string; label: string }>;
  onPadChordChange: (padKey: string, chord: string) => void;
  onSaveEditing: () => void;
};

/**
 * Edit mode panel: chord selector and Save button for changing a pad's chord assignment.
 * SRP: changes when the pad chord-editing UI changes.
 */
export default function PadEditPanel({
  editingPadKey,
  editingChord,
  editableChordOptions,
  onPadChordChange,
  onSaveEditing,
}: PadEditPanelProps) {
  const { t } = useTranslation('generator');
  const theme = useTheme();
  const { appColors } = theme.palette;

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: appColors.surface.translucentPanel,
        border: `1px solid ${appColors.surface.translucentPanelBorder}`,
      }}
    >
      <Box component="p" sx={{ typography: 'subtitle2', mb: 1, mt: 0 }}>
        {t('ui.chordGrid.selectPadThenChord')}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
        <Box sx={{ width: { xs: '68%', sm: 'auto' }, flexGrow: { sm: 1 }, minWidth: 0 }}>
          <SelectField
            label={t('ui.chordGrid.padChordLabel')}
            value={editingChord}
            onChange={(event) => {
              if (editingPadKey) {
                onPadChordChange(editingPadKey, event.target.value);
              }
            }}
            options={editableChordOptions}
            fullWidth
            size="small"
            disabled={!editingPadKey}
          />
        </Box>
        <Button
          size="small"
          variant="contained"
          onClick={onSaveEditing}
          disabled={!editingPadKey}
          sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {t('ui.buttons.save')}
        </Button>
      </Box>
    </Box>
  );
}
