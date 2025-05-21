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
  TextField // For future filter inputs
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import axiosInstance from '../../utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';

// Reusing the getStatusChip helper - consider moving to a shared utils file
const getStatusChip = (status) => {
  let color = 'default';
  let labelId = `penalty-status-${status.toLowerCase().replace(/_/g, '-')}`;
  let fallback = status.replace(/_/g, ' ');
  // Add icons later if desired, similar to PenaltyDetailPage
  switch (status) {
    case 'PENDING_REVIEW': color = 'warning'; break;
    case 'UNDER_JURY_REVIEW': color = 'info'; break;
    case 'AWAITING_FINAL_DECISION': color = 'secondary'; break;
    case 'CLOSED_APPROVED': color = 'success'; break;
    case 'CLOSED_REJECTED': color = 'error'; break;
    case 'CLOSED_NO_ACTION': color = 'default'; break;
    default: break;
  }
  return <Chip label={<Localized id={labelId} fallback={fallback} />} color={color} size="small" />;
};

const ALL_STATUSES_KEY = 'ALL';
const penaltyStatuses = [
  { value: ALL_STATUSES_KEY, labelId: 'filter-status-all', fallback: 'All Statuses' },
  { value: 'PENDING_REVIEW', labelId: 'penalty-status-pending-review', fallback: 'Pending Review' },
  { value: 'UNDER_JURY_REVIEW', labelId: 'penalty-status-under-jury-review', fallback: 'Under Jury Review' },
  { value: 'AWAITING_FINAL_DECISION', labelId: 'penalty-status-awaiting-final-decision', fallback: 'Awaiting Final Decision' },
  { value: 'CLOSED_APPROVED', labelId: 'penalty-status-closed-approved', fallback: 'Closed - Approved' },
  { value: 'CLOSED_REJECTED', labelId: 'penalty-status-closed-rejected', fallback: 'Closed - Rejected' },
  { value: 'CLOSED_NO_ACTION', labelId: 'penalty-status-closed-no-action', fallback: 'Closed - No Action' },
];

export default function AdminPenaltyManager() {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUSES_KEY);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch championships for the selector
  const {
    data: championships = [],
    isLoading: isLoadingChampionships,
    error: championshipsError,
  } = useQuery({
    queryKey: ['championships'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/championships');
      return response.data;
    },
    onSuccess: (data) => {
      // Optionally auto-select first championship, or have an "All Championships" default
      // For now, let admin explicitly select.
    },
  });

  // Fetch penalties based on selected championship, status, and pagination
  const {
    data: penaltiesData,
    isLoading: isLoadingPenalties,
    error: penaltiesError,
    isFetching: isFetchingPenalties, // Use for disabling inputs during fetch
  } = useQuery({
    queryKey: ['adminPenalties', selectedChampionshipId, selectedStatus, page, rowsPerPage],
    queryFn: async () => {
      // Admins can view all, so no need to filter by selectedChampionshipId if it's empty (meaning "all")
      // However, the current backend for /api/penalties REQUIRES championshipId.
      // We might need a new admin-specific endpoint or adjust the existing one for an optional championshipId.
      // For now, we proceed IF a championshipId is selected.
      if (!selectedChampionshipId && selectedChampionshipId !== 'ALL_CHAMPS') { // Add an ALL_CHAMPS key if you want that behavior
          // If no specific championship is selected, and it's not an explicit "all championships" view, return empty.
          // Or, you might want to default to showing nothing or a prompt.
          return { data: [], totalItems: 0, totalPages: 0 };
      }

      const params = {
        page: page + 1, // API is 1-indexed
        limit: rowsPerPage,
      };
      if (selectedChampionshipId && selectedChampionshipId !== 'ALL_CHAMPS') {
        params.championshipId = selectedChampionshipId;
      }
      if (selectedStatus && selectedStatus !== ALL_STATUSES_KEY) {
        params.status = selectedStatus;
      }
      
      const response = await axiosInstance.get('/api/penalties', { params });
      return response.data;
    },
    enabled: !!selectedChampionshipId, // Only fetch if a championship is selected (or an "All" option)
    keepPreviousData: true,
  });

  const penalties = useMemo(() => penaltiesData?.data || [], [penaltiesData]);
  const totalItems = useMemo(() => penaltiesData?.totalItems || 0, [penaltiesData]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleChampionshipChange = (event) => {
    setSelectedChampionshipId(event.target.value);
    setPage(0);
  };
  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}> {/* Wider container for admin */} 
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: '2rem' }} color="primary" />
        <Typography variant="h4" component="h1">
          <Localized id="admin-penalty-manager-title" fallback="Penalty Management" />
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom><Localized id="filters-label" fallback="Filters" /></Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth disabled={isLoadingChampionships || isFetchingPenalties}>
              <InputLabel id="championship-filter-label"><Localized id="filter-by-championship" fallback="Filter by Championship" /></InputLabel>
              <Select
                labelId="championship-filter-label"
                value={selectedChampionshipId}
                label={<Localized id="filter-by-championship" fallback="Filter by Championship" />}
                onChange={handleChampionshipChange}
              >
                <MenuItem value="">
                  <em><Localized id="filter-all-championships" fallback="All Championships (Select One)" /></em>
                </MenuItem>
                {championships.map((champ) => (
                  <MenuItem key={champ.id} value={champ.id}>{champ.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {championshipsError && <Alert severity="error" sx={{mt:1}}><Localized id="fetch-championships-error" /></Alert>}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth disabled={isFetchingPenalties || !selectedChampionshipId}>
              <InputLabel id="status-filter-label"><Localized id="filter-by-status" fallback="Filter by Status" /></InputLabel>
              <Select
                labelId="status-filter-label"
                value={selectedStatus}
                label={<Localized id="filter-by-status" fallback="Filter by Status" />}
                onChange={handleStatusChange}
              >
                {penaltyStatuses.map(statusOpt => (
                  <MenuItem key={statusOpt.value} value={statusOpt.value}>
                    <Localized id={statusOpt.labelId} fallback={statusOpt.fallback} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Future: Add more filters like Race, Submitter, Accused */}
        </Grid>
      </Paper>

      {isLoadingPenalties && !penaltiesData && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {penaltiesError && (
        <Alert severity="error" sx={{ my: 2 }}>
          <Localized id="fetch-admin-penalties-error" fallback="Error fetching penalties." />
        </Alert>
      )}

      {!selectedChampionshipId && !isLoadingChampionships && (
         <Alert severity="info" sx={{ my: 2 }}>
             <Localized id="admin-select-championship-prompt" fallback="Please select a championship to view penalties." />
        </Alert>
      )}

      {selectedChampionshipId && !isLoadingPenalties && !penaltiesError && penalties.length === 0 && (
        <Alert severity="info" sx={{ my: 2 }}>
          <Localized id="no-penalties-found-filters" fallback="No penalties found matching the current filters." />
        </Alert>
      )}

      {penalties.length > 0 && selectedChampionshipId && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="admin penalties table">
              <TableHead>
                <TableRow>
                  <TableCell><Localized id="penalty-header-id" fallback="ID" /></TableCell>
                  <TableCell><Localized id="penalty-header-race" fallback="Race" /></TableCell>
                  <TableCell><Localized id="penalty-header-submitted-by" fallback="Submitted By" /></TableCell>
                  <TableCell><Localized id="penalty-header-accused" fallback="Accused" /></TableCell>
                  <TableCell><Localized id="penalty-header-status" fallback="Status" /></TableCell>
                  <TableCell><Localized id="penalty-header-jurors" fallback="Jurors Assigned" /></TableCell>
                  <TableCell><Localized id="penalty-header-judgments" fallback="Judgments In" /></TableCell>
                  <TableCell><Localized id="penalty-header-submitted-at" fallback="Submitted At" /></TableCell>
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
                    <TableCell align="center">{penalty.assigned_jurors_count ?? 'N/A'}</TableCell>
                    <TableCell align="center">{penalty.judgments_submitted_count ?? 'N/A'}</TableCell>
                    <TableCell>{new Date(penalty.submission_timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        component={RouterLink}
                        to={`/penalties/${penalty.id}`}
                      >
                        <Localized id="admin-view-manage-button" fallback="View/Manage" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Container>
  );
} 