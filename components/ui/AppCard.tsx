import { Card, CardContent, type CardProps } from '@mui/material';
import type { ReactNode } from 'react';

type AppCardProps = CardProps & {
  children: ReactNode;
  noPadding?: boolean;
};

export default function AppCard({
  children,
  noPadding = false,
  ...props
}: AppCardProps) {
  return (
    <Card variant="outlined" {...props}>
      {noPadding ? children : <CardContent>{children}</CardContent>}
    </Card>
  );
}
