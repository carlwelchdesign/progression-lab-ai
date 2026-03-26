'use client';

import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import type { ProgressionRow } from './types';

type ProgressionsTableProps = {
  rows: ProgressionRow[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  canDelete: boolean;
  tableLabel: string;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export default function ProgressionsTable({
  rows,
  total,
  page,
  pageSize,
  isLoading,
  canDelete,
  tableLabel,
  onView,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: ProgressionsTableProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Genre</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <Typography color="text.secondary">Loading data...</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">No progressions found.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading
                ? rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.owner.email}</TableCell>
                      <TableCell>{row.genre ?? 'N/A'}</TableCell>
                      <TableCell>{row.tags.join(', ') || 'None'}</TableCell>
                      <TableCell>{new Date(row.updatedAt).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" onClick={() => onView(row.id)}>
                            View
                          </Button>
                          {canDelete ? (
                            <Button
                              size="small"
                              color="error"
                              variant="contained"
                              onClick={() => onDelete(row.id)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={pageSize}
          onPageChange={(_event, value) => onPageChange(value)}
          onRowsPerPageChange={(event) => onPageSizeChange(Number.parseInt(event.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelDisplayedRows={() => tableLabel}
        />
      </CardContent>
    </Card>
  );
}
