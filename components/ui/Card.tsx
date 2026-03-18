import { Card as MuiCard, CardContent, type CardProps } from '@mui/material';
import type { ReactNode } from 'react';

type CardProps_Custom = CardProps & {
  children: ReactNode;
  noPadding?: boolean;
};

export default function Card({ children, noPadding = false, ...props }: CardProps_Custom) {
  return (
    <MuiCard variant="outlined" {...props}>
      {noPadding ? children : <CardContent>{children}</CardContent>}
    </MuiCard>
  );
}
