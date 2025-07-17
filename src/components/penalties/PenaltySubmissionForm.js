import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Localized } from '@fluent/react';
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import axiosInstance from '../../utils/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PenaltySubmissionForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [selectedAccusedUserId, setSelectedAccusedUserId] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [videoTimestamp, setVideoTimestamp] = useState('');
  const [considerations, setConsiderations] = useState('');
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch championships
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
  });

  useEffect(() => {
    if (championships && championships.length > 0) {
      if (!selectedChampionshipId || !championships.find(c => c.id === selectedChampionshipId)) {
        setSelectedChampionshipId(championships[0].id);
      }
    } else if (!isLoadingChampionships && (!championships || championships.length === 0)) {
      setSelectedChampionshipId('');
    }
  }, [championships, isLoadingChampionships, selectedChampionshipId]);

  // Fetch races for the selected championship
  const {
    data: races = [],
    isLoading: isLoadingRaces,
    error: racesError,
  } = useQuery({
    queryKey: ['racesForChampionship', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const response = await axiosInstance.get(`/api/championships/${selectedChampionshipId}/races`);
      return response.data;
    },
    enabled: !!selectedChampionshipId, // Only run if a championship is selected
    onSuccess: () => {
        // Reset race selection if championship changes and selected race is not in new list
        setSelectedRaceId(''); 
    }
  });

  // Fetch users (attendees) for the selected championship
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ['usersForChampionship', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      // We need an endpoint that lists users for a specific championship.
      // Using /api/drivers for now, assuming it contains user_id and usertag for a championship.
      // This might need adjustment based on your actual API capabilities for listing *all* potential users in a champ.
      const response = await axiosInstance.get(`/api/drivers?championshipId=${selectedChampionshipId}`);
      // We need to filter out the current user if they are logged in and submitting
      // For now, assuming the API gives us { user_id, name (usertag) }
      return response.data.map(u => ({ id: u.user_id, usertag: u.name })); 
    },
    enabled: !!selectedChampionshipId,
    onSuccess: () => {
        setSelectedAccusedUserId('');
    }
  });

  const submissionMutation = useMutation({
    mutationFn: (newPenalty) => axiosInstance.post('/api/penalties/submit', newPenalty),
    onSuccess: (data) => {
      setFormSuccess(data.data.message || 'Penalty submitted successfully!');
      setFormError('');
      // Reset form fields
      setSelectedChampionshipId('');
      setSelectedRaceId('');
      setSelectedAccusedUserId('');
      setVideoLink('');
      setVideoTimestamp('');
      setConsiderations('');
      queryClient.invalidateQueries(['penalties']); // Invalidate penalties list to refetch
      setTimeout(() => navigate('/penalties'), 2000); // Redirect after a delay
    },
    onError: (error) => {
      setFormError(error.response?.data?.message || 'Failed to submit penalty. Please try again.');
      setFormSuccess('');
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedChampionshipId || !selectedRaceId || !selectedAccusedUserId || !videoLink) {
      setFormError('Championship, Race, Accused User, and Video Link are required fields.');
      return;
    }
    if (!videoLink.startsWith('http')) {
        setFormError('Please enter a valid URL for the video link (e.g., http:// or https://).');
        return;
    }

    submissionMutation.mutate({
      championshipId: selectedChampionshipId,
      raceId: selectedRaceId,
      accusedUserId: selectedAccusedUserId,
      videoLink,
      videoTimestamp,
      considerations,
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          <Localized id="submit-penalty-title" fallback="Submit Penalty Review" />
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!championshipsError || (!selectedChampionshipId && submissionMutation.isError)}>
                <InputLabel id="championship-select-label">
                  <Localized id="select-championship-label" />
                </InputLabel>
                <Select
                  labelId="championship-select-label"
                  value={selectedChampionshipId}
                  label={<Localized id="select-championship-label" />}
                  onChange={(e) => {
                    setSelectedChampionshipId(e.target.value);
                    setSelectedRaceId(''); // Reset race when championship changes
                    setSelectedAccusedUserId(''); // Reset accused user
                  }}
                  disabled={isLoadingChampionships}
                >
                  {isLoadingChampionships && <MenuItem value=""><CircularProgress size={20} /></MenuItem>}
                  {championships.map((champ) => (
                    <MenuItem key={champ.id} value={champ.id}>
                      {champ.name}
                    </MenuItem>
                  ))}
                </Select>
                {championshipsError && <Alert severity="error" sx={{mt:1}}><Localized id="fetch-championships-error" /></Alert>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required disabled={!selectedChampionshipId || isLoadingRaces} error={!!racesError || (!selectedRaceId && submissionMutation.isError)}>
                <InputLabel id="race-select-label">
                  <Localized id="select-race-label" />
                </InputLabel>
                <Select
                  labelId="race-select-label"
                  value={selectedRaceId}
                  label={<Localized id="select-race-label" />}
                  onChange={(e) => setSelectedRaceId(e.target.value)}
                >
                  {isLoadingRaces && <MenuItem value=""><CircularProgress size={20} /></MenuItem>}
                  {races.map((race) => (
                    <MenuItem key={race.id} value={race.id}>
                      {race.title}
                    </MenuItem>
                  ))}
                  {!isLoadingRaces && races.length === 0 && selectedChampionshipId && 
                    <MenuItem value="" disabled>
                        <Localized id="no-races-for-championship" fallback="No races found for this championship" />
                    </MenuItem>
                  }
                </Select>
                {racesError && <Alert severity="error" sx={{mt:1}}><Localized id="fetch-races-error" /></Alert>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required disabled={!selectedChampionshipId || isLoadingUsers} error={!!usersError || (!selectedAccusedUserId && submissionMutation.isError)}>
                <InputLabel id="accused-user-select-label">
                  <Localized id="select-accused-user-label" fallback="Select User to Review" />
                </InputLabel>
                <Select
                  labelId="accused-user-select-label"
                  value={selectedAccusedUserId}
                  label={<Localized id="select-accused-user-label" fallback="Select User to Review" />}
                  onChange={(e) => setSelectedAccusedUserId(e.target.value)}
                >
                  {isLoadingUsers && <MenuItem value=""><CircularProgress size={20} /></MenuItem>}
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.usertag}
                    </MenuItem>
                  ))}
                   {!isLoadingUsers && users.length === 0 && selectedChampionshipId && 
                    <MenuItem value="" disabled>
                        <Localized id="no-users-for-championship" fallback="No users found for this championship" />
                    </MenuItem>
                  }
                </Select>
                {usersError && <Alert severity="error" sx={{mt:1}}><Localized id="fetch-users-error" /></Alert>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="videoLink"
                label={<Localized id="video-link-label" fallback="Video Link (URL)" />}
                name="videoLink"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                error={!videoLink && submissionMutation.isError}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="videoTimestamp"
                label={<Localized id="video-timestamp-label" fallback="Video Timestamp (Optional, e.g., 1m23s)" />}
                name="videoTimestamp"
                value={videoTimestamp}
                onChange={(e) => setVideoTimestamp(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="considerations"
                label={<Localized id="considerations-label" fallback="Considerations / Description" />}
                name="considerations"
                multiline
                rows={4}
                value={considerations}
                onChange={(e) => setConsiderations(e.target.value)}
              />
            </Grid>
          </Grid>
          
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>
          )}
          {formSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>{formSuccess}</Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={submissionMutation.isLoading}
          >
            {submissionMutation.isLoading ? <CircularProgress size={24} /> : <Localized id="submit-penalty-button" fallback="Submit Penalty" />}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 