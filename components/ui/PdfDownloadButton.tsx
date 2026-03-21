'use client';

import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { Button, type ButtonProps } from '@mui/material';
import { useState } from 'react';

import type { PdfChartOptions } from '../../lib/pdf';

type PdfDownloadButtonProps = Omit<ButtonProps, 'children' | 'startIcon' | 'onClick'> & {
  chartOptions: PdfChartOptions;
  label?: string;
};

export default function PdfDownloadButton({
  chartOptions,
  label = 'PDF',
  disabled,
  ...rest
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const { downloadSessionPdf } = await import('../../lib/pdf');
      await downloadSessionPdf(chartOptions);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      startIcon={<PictureAsPdfOutlinedIcon />}
      disabled={disabled ?? isGenerating}
      onClick={() => void handleClick()}
      {...rest}
    >
      {isGenerating ? 'Generating…' : label}
    </Button>
  );
}
