import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, List, ListItem, ListItemText, Button, TextField, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { Localized } from '@fluent/react';

// --- Expected Backend Endpoints --- 
// GET /api/championships - Returns [{ id, name, created_at }, ...]
// POST /api/championships - Expects { name: string }, Returns { id, name, created_at }
// GET /api/championships/:champId/races - Returns [{ id, title, date, championship_id }, ...]
// POST /api/championships/:champId/races - Expects { title: string, date: string }, Returns { id, title, date, championship_id }
// -------------------------------------

function ChampionshipManager() {
  const [championships, setChampionships] = useState([]);
  const [races, setRaces] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState(null);
  const [newChampionshipName, setNewChampionshipName] = useState('');
  const [newRaceTitle, setNewRaceTitle] = useState('');
  const [newRaceDate, setNewRaceDate] = useState(''); // Store date as string YYYY-MM-DD
  const [loadingChampionships, setLoadingChampionships] = useState(false);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  // Fetch championships on mount
  useEffect(() => {
    fetchChampionships();
  }, []);

  // Fetch races when a championship is selected
  useEffect(() => {
    if (selectedChampionship) {
      fetchRaces(selectedChampionship.id);
    } else {
      setRaces([]); // Clear races if no championship is selected
    }
  }, [selectedChampionship]);

  const fetchChampionships = async () => {
    setLoadingChampionships(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/championships`);
      setChampionships(response.data);
    } catch (err) {
      console.error("Error fetching championships:", err);
      setError('fetch-championships-error'); // Use localized ID
    } finally {
      setLoadingChampionships(false);
    }
  };

  const fetchRaces = async (champId) => {
    setLoadingRaces(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/championships/${champId}/races`);
      setRaces(response.data);
    } catch (err) {
      console.error(`Error fetching races for championship ${champId}:`, err);
      setError('fetch-races-error'); // Use localized ID
    } finally {
      setLoadingRaces(false);
    }
  };

  const handleCreateChampionship = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(`${apiUrl}/api/championships`, { name: newChampionshipName });
      setNewChampionshipName('');
      fetchChampionships();
    } catch (err) {
      console.error("Error creating championship:", err);
      setError(err.response?.data?.message || 'create-championship-error');
    }
  };

  const handleCreateRace = async (e) => {
    e.preventDefault();
    if (!selectedChampionship) return;
    setError(null);
    try {
      await axios.post(`${apiUrl}/api/championships/${selectedChampionship.id}/races`, { 
          title: newRaceTitle, 
          date: newRaceDate
      });
      setNewRaceTitle('');
      setNewRaceDate('');
      fetchRaces(selectedChampionship.id);
    } catch (err) {
      console.error("Error creating race:", err);
      setError(err.response?.data?.message || 'create-race-error');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        <Localized id="admin-championship-manager-title" />
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}><Localized id={error} /></Alert>}

      <Grid container spacing={4}>
        {/* Championship List and Creation */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6"><Localized id="admin-championships-heading" /></Typography>
            {loadingChampionships ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {championships.map((champ) => (
                  <ListItem 
                    key={champ.id} 
                    button 
                    selected={selectedChampionship?.id === champ.id}
                    onClick={() => setSelectedChampionship(champ)}
                  >
                    <ListItemText primary={champ.name} />
                  </ListItem>
                ))}
                {championships.length === 0 && !loadingChampionships && (
                  <ListItem><ListItemText primary={<Localized id="admin-no-championships" />} /></ListItem>
                )}
              </List>
            )}
            <Typography variant="subtitle1"><Localized id="admin-add-championship-subheading" /></Typography>
            <Box component="form" onSubmit={handleCreateChampionship} sx={{ mt: 1 }}>
              <TextField
                label={<Localized id="admin-new-championship-label" />}
                value={newChampionshipName}
                onChange={(e) => setNewChampionshipName(e.target.value)}
                fullWidth
                required
                size="small"
                sx={{ mb: 1 }}
              />
              <Button type="submit" variant="contained" size="small">
                <Localized id="admin-create-championship-button" />
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Race List and Creation (for selected championship) */}
        <Grid item xs={12} md={8}>
          {selectedChampionship && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6"><Localized id="admin-races-heading" vars={{ champName: selectedChampionship.name }}/></Typography>
              {loadingRaces ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                  {races.map((race) => (
                    <ListItem key={race.id}>
                      <ListItemText 
                        primary={race.title} 
                        secondary={<Localized id="admin-race-date-label" vars={{ raceDate: race.date ? new Date(race.date).toLocaleDateString() : 'Not Set' }} />} 
                      />
                      {/* TODO: Add Edit/Delete buttons later */}
                    </ListItem>
                  ))}
                  {races.length === 0 && !loadingRaces && (
                    <ListItem><ListItemText primary={<Localized id="admin-no-races" />} /></ListItem>
                  )}
                </List>
              )}
              <Typography variant="subtitle1"><Localized id="admin-add-race-subheading" /></Typography>
              <Box component="form" onSubmit={handleCreateRace} sx={{ mt: 1 }}>
                <TextField
                  label={<Localized id="admin-new-race-title-label" />}
                  value={newRaceTitle}
                  onChange={(e) => setNewRaceTitle(e.target.value)}
                  fullWidth
                  required
                  size="small"
                  sx={{ mb: 1 }}
                />
                 <TextField
                  label={<Localized id="admin-new-race-date-label" />}
                  type="date"
                  value={newRaceDate}
                  onChange={(e) => setNewRaceDate(e.target.value)}
                  fullWidth
                  required
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 1 }}
                />
                <Button type="submit" variant="contained" size="small">
                  <Localized id="admin-add-race-button" vars={{ champName: selectedChampionship.name }} />
                </Button>
              </Box>
            </Paper>
          )}
          {!selectedChampionship && (
             <Typography><Localized id="admin-select-championship-prompt" /></Typography>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default ChampionshipManager; 