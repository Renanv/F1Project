import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Localized } from '@fluent/react';
import {
  Container,
  Typography,
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
  Chip
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import axiosInstance from '../../utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';

export default function MyJuryTasksPage() {
  const {
    data: assignedPenalties = [], // Default to empty array
    isLoading,
    error,
  } = useQuery({
    queryKey: ['myJuryTasks'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/jury/assigned-penalties');
      return response.data.data; // API wraps in { success: true, data: [...] }
    },
    // staleTime: 5 * 60 * 1000, // Optional: cache for 5 minutes
  });

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          <Localized id="fetch-jury-tasks-error" 
                     fallback={error.response?.data?.message || 'Error fetching your assigned jury tasks.'} />
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <Localized id="my-jury-tasks-title" fallback="My Pending Jury Tasks" />
      </Typography>

      {assignedPenalties.length === 0 ? (
        <Alert severity="info">
          <Localized id="no-pending-jury-tasks" fallback="You have no pending jury tasks at the moment." />
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="assigned penalties table">
              <TableHead>
                <TableRow>
                  <TableCell><Localized id="jury-task-header-penalty-id" fallback="Penalty ID" /></TableCell>
                  <TableCell><Localized id="jury-task-header-championship" fallback="Championship" /></TableCell>
                  <TableCell><Localized id="jury-task-header-race" fallback="Race" /></TableCell>
                  <TableCell><Localized id="jury-task-header-accused" fallback="Accused User" /></TableCell>
                  <TableCell><Localized id="jury-task-header-your-slot" fallback="Your Slot" /></TableCell>
                  <TableCell><Localized id="jury-task-header-submitted-at" fallback="Submitted At" /></TableCell>
                  <TableCell><Localized id="jury-task-header-actions" fallback="Actions" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedPenalties.map((penalty) => (
                  <TableRow hover key={penalty.penalty_id}>
                    <TableCell>{penalty.penalty_id}</TableCell>
                    <TableCell>{penalty.championship_name || 'N/A'}</TableCell>
                    <TableCell>{penalty.race_title || 'N/A'}</TableCell>
                    <TableCell>{penalty.accused_usertag || 'N/A'}</TableCell>
                    <TableCell>
                        <Chip icon={<GavelIcon />} label={penalty.jury_slot} color="primary" size="small" variant="outlined"/>
                    </TableCell>
                    <TableCell>
                      {new Date(penalty.submission_timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        component={RouterLink}
                        to={`/penalties/${penalty.penalty_id}`}
                      >
                        <Localized id="view-and-judge-button" fallback="View & Judge" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* No pagination for now, assuming the list of pending tasks won't be excessively long */}
        </Paper>
      )}
    </Container>
  );
} 