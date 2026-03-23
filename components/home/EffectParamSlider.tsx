'use client';

import { Slider, Typography } from '@mui/material';

type EffectParamSliderProps = {
  label: string;
  valueText: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
  disabled: boolean;
};

export default function EffectParamSlider({
  label,
  valueText,
  value,
  onChange,
  min,
  max,
  step,
  ariaLabel,
  disabled,
}: EffectParamSliderProps) {
  return (
    <>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        {label}: {valueText}
      </Typography>
      <Slider
        size="small"
        value={value}
        onChange={(_, nextValue) => onChange(nextValue as number)}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        disabled={disabled}
      />
    </>
  );
}
