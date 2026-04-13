'use client';

import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

type Props = {
  chords: string[];
  label?: string;
};

export default function TryInGeneratorButton({ chords, label }: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('onboarding_seed_chords', chords.join(', '));
    }
    router.push('/#generator');
  };

  return (
    <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleClick}>
      {label ?? 'Try in Generator'}
    </Button>
  );
}
