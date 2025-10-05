import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Localized } from '@fluent/react';
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TablePagination,
  Grid,
  Chip,
  Card,
  CardContent,
  Skeleton,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axiosInstance from '../../utils/axiosInstance';
import EmptyState from '../EmptyState';
import { useQuery } from '@tanstack/react-query';
import { getJudgmentDisplay } from '../../utils/penaltyUtils';

// Helper to get a user-friendly status
const getStatusChip = (status) => {
  let color = 'default';
  let labelId = `penalty-status-${status.toLowerCase().replace(/_/g, '-')}`;
  let fallback = status.replace(/_/g, ' ');

  switch (status) {
    case 'PENDING_REVIEW':
      color = 'warning';
      break;
    case 'UNDER_JURY_REVIEW':
      color = 'info';
      break;
    case 'AWAITING_FINAL_DECISION':
      color = 'secondary';
      break;
    case 'CLOSED_APPROVED':
      color = 'success';
      break;
    case 'CLOSED_REJECTED':
      color = 'error';
      break;
    case 'CLOSED_NO_ACTION':
      color = 'default';
      break;
    default:
      break;
  }
  return <Chip label={<Localized id={labelId} fallback={fallback} />} color={color} size="small" />;
};


export default function PenaltiesListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(() => localStorage.getItem('penalties:selectedChampionshipId') || '');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch championships for the selector
  const {
    data: championshipsData = [],
    isLoading: isLoadingChampionships,
    error: championshipsError,
  } = useQuery({
    queryKey: ['championships', 'penalties', 'grouped'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/championships?forPenalties=true&groupByStatus=true');
      return response.data;
    },
  });

  // Process grouped data for dropdown
  const championships = React.useMemo(() => {
    if (!championshipsData.grouped) {
      return championshipsData; // Fallback to flat list
    }
    
    // Convert grouped data to flat list for compatibility
    const flatList = [];
    const statusOrder = ['RUNNING', 'FINISHED']; // Penalties exclude FINISHED, so mainly RUNNING
    
    statusOrder.forEach(status => {
      if (championshipsData.data[status]) {
        flatList.push(...championshipsData.data[status]);
      }
    });
    
    return flatList;
  }, [championshipsData]);

  useEffect(() => {
    if (championships && championships.length > 0) {
      if (!selectedChampionshipId || !championships.find(c => c.id === selectedChampionshipId)) {
        setSelectedChampionshipId(championships[0].id);
      }
    } else if (!isLoadingChampionships && (!championships || championships.length === 0)) {
      setSelectedChampionshipId('');
    }
  }, [championships, isLoadingChampionships, selectedChampionshipId]);

  // Persist selection
  useEffect(() => {
    if (selectedChampionshipId) {
      localStorage.setItem('penalties:selectedChampionshipId', selectedChampionshipId);
    }
  }, [selectedChampionshipId]);

  // Fetch penalties based on selected championship and pagination
  const {
    data: penaltiesData,
    isLoading: isLoadingPenalties,
    error: penaltiesError,
    isFetching: isFetchingPenalties,
  } = useQuery({
    queryKey: ['penalties', selectedChampionshipId, page, rowsPerPage],
    queryFn: async () => {
      console.log('[PenaltiesListPage] Fetching penalties with params:', {
        championshipId: selectedChampionshipId,
        pageApi: page + 1, // API is 1-indexed
        limit: rowsPerPage,
        rawFrontendPage: page
      });
      if (!selectedChampionshipId) {
        console.log('[PenaltiesListPage] No selectedChampionshipId, returning empty.');
        return { data: [], totalItems: 0, totalPages: 0 };
      }
      const response = await axiosInstance.get('/api/penalties', {
        params: {
          championshipId: selectedChampionshipId,
          page: page + 1, // API is 1-indexed
          limit: rowsPerPage,
        },
      });
      console.log('[PenaltiesListPage] Received penalties response:', response.data);
      return response.data;
    },
    enabled: !!selectedChampionshipId,
    keepPreviousData: true, // Smooth pagination experience
  });

  const penalties = useMemo(() => penaltiesData?.data || [], [penaltiesData]);
  const totalItems = useMemo(() => penaltiesData?.totalItems || 0, [penaltiesData]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  const handleChampionshipChange = (event) => {
    setSelectedChampionshipId(event.target.value);
    setPage(0); // Reset page when championship changes
  };

  const renderMobileCard = (penalty) => (
    <Grid item xs={12} key={penalty.id}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">#{penalty.id}</Typography>
            {getStatusChip(penalty.status)}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary"><Localized id="penalty-header-race" fallback="Race" />:</Typography>
            <Typography variant="body2">{penalty.race_title || 'N/A'}</Typography>
            <Typography variant="body2" color="text.secondary"><Localized id="penalty-header-submitted-by" fallback="Submitted By" />:</Typography>
            <Typography variant="body2">{penalty.submitter_usertag || 'N/A'}</Typography>
            <Typography variant="body2" color="text.secondary"><Localized id="penalty-header-accused" fallback="Accused" />:</Typography>
            <Typography variant="body2">{penalty.accused_usertag || 'N/A'}</Typography>
            <Typography variant="body2" color="text.secondary"><Localized id="penalty-header-submitted-at" fallback="Submitted At" />:</Typography>
            <Typography variant="body2">{(() => {
              const date = new Date(penalty.submission_timestamp);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            })()}</Typography>
            <Typography variant="body2" color="text.secondary"><Localized id="penalty-header-final-outcome" fallback="Final Outcome" />:</Typography>
            <Typography variant="body2">{getJudgmentDisplay(penalty.final_outcome) || '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              component={RouterLink}
              to={`/penalties/${penalty.id}`}
            >
              <Localized id="view-details-button" fallback="View Details" />
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <Localized id="penalties-list-title" fallback="Penalty Submissions" />
      </Typography>

      {isLoadingChampionships && <Skeleton variant="rounded" height={56} />}
      {championshipsError && (
        <Alert severity="error">
          <Localized id="fetch-championships-error" />
        </Alert>
      )}

      {championships.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="championship-select-label">
            <Localized id="select-championship-label" />
          </InputLabel>
          <Select
            labelId="championship-select-label"
            value={selectedChampionshipId}
            label={<Localized id="select-championship-label" />}
            onChange={handleChampionshipChange}
            disabled={isLoadingChampionships || isFetchingPenalties}
          >
            {championships.map((champ) => (
              <MenuItem key={champ.id} value={champ.id}>
                {champ.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {(!selectedChampionshipId && !isLoadingChampionships && championships.length === 0) && (
        <Alert severity="info"><Localized id="no-championships-for-penalties" fallback="No championships available to show penalties." /></Alert>
      )}

      {selectedChampionshipId && (
        <>
          {isLoadingPenalties && !penaltiesData && (
            <Box sx={{ my: 2 }}>
              {isMobile ? (
                <Grid container spacing={2}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Grid item xs={12} key={i}>
                      <Skeleton variant="rounded" height={120} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Skeleton variant="rounded" height={320} />
              )}
            </Box>
          )}
          {penaltiesError && (
            <Alert severity="error" sx={{ my: 2 }}>
              <Localized id="fetch-penalties-error" fallback="Error fetching penalties for this championship." />
            </Alert>
          )}

          {!isLoadingPenalties && !penaltiesError && penalties.length === 0 && (
            <EmptyState
              titleId="penalties-page-title"
              messageId="no-penalties-found-for-championship"
              actionLabelId="submit-new-penalty-button"
              onAction={() => {}}
            />
          )}

          {penalties.length > 0 && (
            isMobile ? (
              <Grid container spacing={2}>
                {penalties.map(renderMobileCard)}
              </Grid>
            ) : (
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer>
                <Table stickyHeader aria-label="penalties table">
                  <TableHead>
                    <TableRow>
                      <TableCell><Localized id="penalty-header-id" fallback="ID" /></TableCell>
                      <TableCell><Localized id="penalty-header-race" fallback="Race" /></TableCell>
                      <TableCell><Localized id="penalty-header-submitted-by" fallback="Submitted By" /></TableCell>
                      <TableCell><Localized id="penalty-header-accused" fallback="Accused" /></TableCell>
                      <TableCell><Localized id="penalty-header-status" fallback="Status" /></TableCell>
                      <TableCell><Localized id="penalty-header-submitted-at" fallback="Submitted At" /></TableCell>
                      <TableCell><Localized id="penalty-header-final-outcome" fallback="Final Outcome" /></TableCell>
                      <TableCell><Localized id="penalty-header-actions" fallback="Actions" /></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {penalties.map((penalty) => (
                      <TableRow hover key={penalty.id}>
                        <TableCell>{penalty.id}</TableCell>
                        <TableCell>{penalty.race_title || 'N/A'}</TableCell>
                        <TableCell>{penalty.submitter_usertag || 'N/A'}</TableCell>
                        <TableCell>{penalty.accused_usertag || 'N/A'}</TableCell>
                        <TableCell>{getStatusChip(penalty.status)}</TableCell>
                        <TableCell>
                          {(() => {
                            const date = new Date(penalty.submission_timestamp);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const seconds = String(date.getSeconds()).padStart(2, '0');
                            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                          })()}
                        </TableCell>
                        <TableCell>{getJudgmentDisplay(penalty.final_outcome) || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            component={RouterLink}
                            to={`/penalties/${penalty.id}`}
                          >
                            <Localized id="view-details-button" fallback="View Details" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalItems}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                // Localization for pagination can be tricky with MUI, often relies on Theme's locale.
                // For simple labels, you can use `labelRowsPerPage` etc., but it's not using Fluent directly.
                // Example: labelRowsPerPage={<Localized id="pagination-rows-per-page" />}
                labelRowsPerPage={<Localized id="pagination-rows-per-page" />}
                labelDisplayedRows={({ from, to, count }) => {
                  // The "of more than" message is usually when count is -1 (e.g. server-side pagination without total count)
                  // We have totalItems, so we should generally use the standard one.
                  // Adjust if your API sometimes returns -1 for count.
                  const key = count === -1 ? "pagination-displayed-rows-of-more-than" : "pagination-displayed-rows";
                  return <Localized id={key} vars={{ from, to, count }} />;
                }}
              />
            </Paper>
            )
          )}
        </>
      )}
       <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
            <Grid item>
                <Button
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/penalties/submit"
                >
                    <Localized id="submit-new-penalty-button" fallback="Submit New Penalty" />
                </Button>
            </Grid>
        </Grid>
    </Container>
  );
} 