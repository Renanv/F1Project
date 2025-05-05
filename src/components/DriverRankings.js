import React, { useEffect, useState, useCallback } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import FileUpload from './FileUpload';
import axiosInstance from '../utils/axiosInstance';

function DriverRankings({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [racesList, setRacesList] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(false);

  // State for Championship selection
  const [championshipsList, setChampionshipsList] = useState([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [loadingChampionships, setLoadingChampionships] = useState(true);

  // Fetch Championships List
  const fetchChampionships = useCallback(async () => {
    setLoadingChampionships(true);
    try {
      // ASSUMPTION: /api/championships/list endpoint exists and is public
      // OR /api/championships (GET) is made public
      const res = await axiosInstance.get('/api/championships'); 
      setChampionshipsList(res.data);
      if (res.data.length > 0) {
        // Select the first championship by default
        setSelectedChampionshipId(res.data[0].id); 
      } else {
        setSelectedChampionshipId(''); // No championships available
      }
    } catch (err) {
      console.error('Error fetching championships:', err);
      setError('fetch-championships-error'); // Use the key directly
    } finally {
      setLoadingChampionships(false);
    }
  }, []);

  // Fetch Driver Rankings for a specific championship
  const fetchRankings = useCallback(async (championshipId) => {
    if (!championshipId) {
        setDrivers([]); // Clear drivers if no championship is selected
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch drivers based on selected championship
      // ASSUMPTION: Backend /api/drivers accepts ?championshipId=
      const driversRes = await axiosInstance.get(`/api/drivers?championshipId=${championshipId}`);
      setDrivers(driversRes.data);
    } catch (err) {
      console.error('Error fetching driver rankings:', err);
      setError('fetch-rankings-error'); // Use the key directly
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load: fetch championships first, then rankings for the default
  useEffect(() => {
    fetchChampionships();
  }, [fetchChampionships]);

  // Fetch rankings when the selected championship changes
  useEffect(() => {
    if (selectedChampionshipId) {
      fetchRankings(selectedChampionshipId);
    }
  }, [selectedChampionshipId, fetchRankings]);

  // Fetch races list (kept separate for the admin upload component)
  useEffect(() => {
    const fetchRaces = async () => {
        if (!isAdmin) return; // Only fetch races if admin
        setLoadingRaces(true);
        try {
            const racesRes = await axiosInstance.get('/api/races/list');
            setRacesList(racesRes.data);
        } catch (err) {
            console.error('Error fetching races list:', err);
            // Handle race list error separately if needed
        } finally {
            setLoadingRaces(false);
        }
    };
    fetchRaces();
  }, [isAdmin]);

  // Handler for Championship selection change
  const handleChampionshipChange = (event) => {
    setSelectedChampionshipId(event.target.value);
  };

  // Handler for Race selection change (for upload)
  const handleRaceChange = (event) => {
    setSelectedRaceId(event.target.value);
  };

  const renderContent = () => {
    if (isLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>;
    }
    if (error) {
      return <Alert severity="error"><Localized id={error} /></Alert>;
    }
    if (drivers.length === 0) {
      return <Typography><Localized id="no-drivers-found" /></Typography>;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Localized id="driver-position" /></TableCell>
              <TableCell><Localized id="driver-name" /></TableCell>
              <TableCell><Localized id="driver-number" /></TableCell>
              <TableCell><Localized id="driver-team" /></TableCell>
              <TableCell><Localized id="driver-table-score" /></TableCell>
              <TableCell><Localized id="driver-table-points" /></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((driver, index) => {
              const formattedScore = typeof driver.score === 'number' 
                  ? driver.score.toFixed(2) 
                  : (typeof driver.score === 'string' ? parseFloat(driver.score).toFixed(2) : '0.00');
              
              const actualPoints = driver.points !== null && driver.points !== undefined ? driver.points : 0;
              const teamName = driver.team_name || 'N/A';

              return (
                <TableRow key={driver.user_id || driver.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.driver_number}</TableCell>
                  <TableCell>{teamName ? teamName : <Localized id="team-name-not-available" />}</TableCell>
                  <TableCell>
                    <Localized id="driver-score-value" vars={{ score: formattedScore }}>
                      <span>{formattedScore} pts</span>
                    </Localized>
                  </TableCell>
                  <TableCell>{actualPoints}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <Localized id="driver-rankings-title" />
      </Typography>

      {/* Championship Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth disabled={loadingChampionships || isLoading}>
            <InputLabel id="championship-select-label"><Localized id="select-championship-label" /></InputLabel>
            <Select
                labelId="championship-select-label"
                value={selectedChampionshipId}
                label={<Localized id="select-championship-label" />}
                onChange={handleChampionshipChange}
            >
                {championshipsList.length === 0 && !loadingChampionships && (
                     <MenuItem value="" disabled>
                         <em><Localized id="no-championships-available" /></em>
                     </MenuItem>
                )}
                {championshipsList.map((champ) => (
                    <MenuItem key={champ.id} value={champ.id}>{champ.name}</MenuItem>
                ))}
            </Select>
        </FormControl>
      </Box>

      {/* Loading and Error States */} 
      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>}
      {error && !isLoading && <Alert severity="error"><Localized id={error} fallback={<Localized id='generic-error-fallback' />} /></Alert>}
      {!isLoading && !error && drivers.length === 0 && !loadingChampionships && selectedChampionshipId && (
           <Typography sx={{mt: 2}}><Localized id="no-drivers-found" /></Typography>
      )}

      {/* Content Grid - only show table if not loading, no error, and drivers exist */} 
      {!isLoading && !error && drivers.length > 0 && (
        <Grid container spacing={4}>
            <Grid item xs={12} md={isAdmin ? 8 : 12}>
                <TableContainer component={Paper}>
                    {/* Table Head */} 
                    <Table>
                    <TableHead>
                        <TableRow>
                        <TableCell><Localized id="driver-position" /></TableCell>
                        <TableCell><Localized id="driver-name" /></TableCell>
                        <TableCell><Localized id="driver-number" /></TableCell>
                        <TableCell><Localized id="driver-team" /></TableCell>
                        <TableCell><Localized id="driver-table-score" /></TableCell>
                        <TableCell><Localized id="driver-table-points" /></TableCell>
                        </TableRow>
                    </TableHead>
                    {/* Table Body */} 
                    <TableBody>
                        {drivers.map((driver, index) => {
                        const formattedScore = typeof driver.score === 'number' 
                            ? driver.score.toFixed(2) 
                            : (typeof driver.score === 'string' ? parseFloat(driver.score).toFixed(2) : '0.00');
                        
                        const actualPoints = driver.points !== null && driver.points !== undefined ? driver.points : 0;
                        const teamName = driver.team_name; // Get potential team name

                        return (
                            <TableRow key={driver.user_id || driver.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{driver.name}</TableCell>
                            <TableCell>{driver.driver_number}</TableCell>
                            <TableCell>{teamName ? teamName : <Localized id="team-name-not-available" />}</TableCell>
                            <TableCell>
                                <Localized id="driver-score-value" vars={{ score: formattedScore }}>
                                <span>{formattedScore} pts</span>
                                </Localized>
                            </TableCell>
                            <TableCell>{actualPoints}</TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
            {isAdmin && (
            <Grid item xs={12} md={4}>
                {/* Race Selector for Upload (Keep as is) */} 
                <Box sx={{ mb: 3 }}>
                <FormControl fullWidth disabled={loadingRaces}>
                    <InputLabel id="race-select-label"><Localized id="select-race-label"/></InputLabel>
                    <Select
                    labelId="race-select-label"
                    id="race-select"
                    value={selectedRaceId}
                    label={<Localized id="select-race-label"/>}
                    onChange={handleRaceChange}
                    >
                    <MenuItem value="">
                        <em><Localized id="select-race-placeholder"/></em>
                    </MenuItem>
                    {racesList.map((race) => (
                        <MenuItem key={race.id} value={race.id}>
                        {race.name}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
                </Box>
                <FileUpload 
                    onSuccess={() => fetchRankings(selectedChampionshipId)} // Refresh rankings for current champ after upload
                    selectedRaceId={selectedRaceId}
                    isAdmin={isAdmin}
                />
            </Grid>
            )}
        </Grid>
      )}
    </Container>
  );
}

export default DriverRankings; 