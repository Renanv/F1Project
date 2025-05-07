import React, { useEffect, useState, useCallback } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Box, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import FileUpload from './FileUpload';
import axiosInstance from '../utils/axiosInstance';

function DriverRankings({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [racesList, setRacesList] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(false);

  const [championshipsList, setChampionshipsList] = useState([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [loadingChampionships, setLoadingChampionships] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchChampionships = useCallback(async () => {
    setLoadingChampionships(true);
    setError(null); // Clear previous errors
    try {
      const res = await axiosInstance.get('/api/championships'); 
      setChampionshipsList(res.data);
      if (res.data.length > 0) {
        setSelectedChampionshipId(res.data[0].id); 
      } else {
        setSelectedChampionshipId('');
        setDrivers([]); // Clear drivers if no championships
      }
    } catch (err) {
      console.error('Error fetching championships:', err);
      setError('fetch-championships-error');
    } finally {
      setLoadingChampionships(false);
    }
  }, []);

  const fetchRankings = useCallback(async (championshipId) => {
    if (!championshipId) {
        setDrivers([]);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const driversRes = await axiosInstance.get(`/api/drivers?championshipId=${championshipId}`);
      setDrivers(driversRes.data);
    } catch (err) {
      console.error('Error fetching driver rankings:', err);
      setError('fetch-rankings-error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChampionships();
  }, [fetchChampionships]);

  useEffect(() => {
    if (selectedChampionshipId) {
      fetchRankings(selectedChampionshipId);
    } else {
      setDrivers([]); // Clear drivers if no championship is selected
      setIsLoading(false); // Stop loading if no championship to fetch for
    }
  }, [selectedChampionshipId, fetchRankings]);

  useEffect(() => {
    const fetchRacesForAdmin = async () => {
        if (!isAdmin) return;
        setLoadingRaces(true);
        try {
            const racesRes = await axiosInstance.get('/api/races/list'); // Ensure this endpoint exists
            setRacesList(racesRes.data || []);
        } catch (err) {
            console.error('Error fetching races list for admin:', err);
            // Optionally set a specific error for races list if needed
        } finally {
            setLoadingRaces(false);
        }
    };
    fetchRacesForAdmin();
  }, [isAdmin]);

  const handleChampionshipChange = (event) => {
    setSelectedChampionshipId(event.target.value);
  };

  const handleRaceChange = (event) => {
    setSelectedRaceId(event.target.value);
  };

  const renderDriverCard = (driver, index) => {
    const formattedScore = typeof driver.score === 'number' 
        ? driver.score.toFixed(2) 
        : (typeof driver.score === 'string' ? parseFloat(driver.score).toFixed(2) : '0.00');
    const actualPoints = driver.points !== null && driver.points !== undefined ? driver.points : 0;
    const teamName = driver.team_name || 'N/A';

    return (
      <Grid item xs={12} key={driver.user_id || driver.id}>
        <Card sx={{ mb: 2 }} elevation={2}>
          <CardContent sx={{ p: 2 }}> {/* Main CardContent, padding only */}
            {/* Top Row: Rank/Name and Driver Number */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h6" component="div">
                {index + 1}. {driver.name}
              </Typography>
              <Typography variant="body2" component="span" color="text.secondary">
                #{driver.driver_number}
              </Typography>
            </Box>

            {/* Bottom Row: Team/LSF-Score and Points */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              {/* Left side of Bottom Row: Team and LSF Score */}
              <Box>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  <Localized id="driver-team" />: {teamName ? teamName : <Localized id="team-name-not-available" />}
                </Typography>
                <Typography variant="body1">
                  <Localized id="driver-table-score" />: <Localized id="driver-score-value" vars={{ score: formattedScore }}><span>{formattedScore} pts</span></Localized>
                </Typography>
              </Box>
              {/* Right side of Bottom Row: Points */}
              <Box sx={{ ml: 1 }}> {/* Added ml for a little space */}
                <Typography variant="h3" component="span" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {actualPoints}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderTableContent = () => (
    <TableContainer component={Paper}>
      <Table stickyHeader aria-label="driver rankings table">
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
              <TableRow hover key={driver.user_id || driver.id}> {/* Ensure key is unique */}
                <TableCell component="th" scope="row">{index + 1}</TableCell>
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

  const renderRankingsDisplay = () => {
    // Prioritize loading and error states for the rankings data itself
    if (isLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>;
    }
    if (error && !loadingChampionships) { // Show error only if not also loading championships
      return <Alert severity="error" sx={{mt: 2}}><Localized id={error} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
    }
    if (!selectedChampionshipId && !loadingChampionships) { // Prompt to select championship if none is selected and not loading
        return <Typography sx={{mt: 2}}><Localized id="admin-select-championship-prompt" /></Typography>;
    }
    if (drivers.length === 0 && selectedChampionshipId && !isLoading) { // If a champ is selected, not loading, but no drivers
      return <Typography sx={{mt: 2}}><Localized id="no-drivers-found" /></Typography>;
    }
    if (drivers.length === 0 && !selectedChampionshipId && !isLoading) { // Default if no drivers and no championship and not loading
        return <Typography sx={{mt: 2}}><Localized id="no-drivers-found" /></Typography>;
    }

    // If we have drivers and no critical errors/loading for rankings:
    if (drivers.length > 0) {
        return isMobile ? (
            <Grid container spacing={0}> 
                {drivers.map((driver, index) => renderDriverCard(driver, index))}
            </Grid>
        ) : renderTableContent();
    }
    return null; // Fallback, should be covered by above conditions
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <Localized id="driver-rankings-title" />
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth disabled={loadingChampionships || isLoading}> {/* Disable if initial champs are loading OR rankings are loading */}
            <InputLabel id="championship-select-label"><Localized id="select-championship-label" /></InputLabel>
            <Select
                labelId="championship-select-label"
                value={selectedChampionshipId}
                label={<Localized id="select-championship-label" />}
                onChange={handleChampionshipChange}
            >
                {loadingChampionships && (
                    <MenuItem value="" disabled>
                         <em><Localized id="loading-championships" /></em>
                    </MenuItem>
                )}
                {!loadingChampionships && championshipsList.length === 0 && (
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
      
      <Grid container spacing={4}>
          <Grid item xs={12} md={isAdmin && !isMobile ? 8 : 12}> {/* Adjust md breakpoint if FileUpload is hidden */}
            {renderRankingsDisplay()} {/* This will render based on loading/error/mobile status */}
          </Grid>
          {isAdmin && !isMobile && (
            <Grid item xs={12} md={4}>
                <Paper sx={{p: 2}} elevation={1}>
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth disabled={loadingRaces || championshipsList.length === 0 || !selectedChampionshipId}>
                            <InputLabel id="race-select-admin-label"><Localized id="select-race-label"/></InputLabel>
                            <Select
                                labelId="race-select-admin-label"
                                value={selectedRaceId}
                                label={<Localized id="select-race-label"/>}
                                onChange={handleRaceChange}
                                size="small"
                            >
                                <MenuItem value="" disabled>
                                    <em><Localized id="select-race-placeholder"/></em>
                                </MenuItem>
                                {racesList.map((race) => (
                                    <MenuItem key={race.id} value={race.id}>
                                    {race.name}
                                    </MenuItem>
                                ))}
                                {racesList.length === 0 && !loadingRaces && (
                                    <MenuItem value="" disabled>
                                        <em><Localized id="no-races-for-upload" /></em>
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Box>
                    <FileUpload 
                        onSuccess={() => fetchRankings(selectedChampionshipId)} 
                        selectedRaceId={selectedRaceId}
                        isAdmin={isAdmin}
                    />
                </Paper>
            </Grid>
          )}
      </Grid>
    </Container>
  );
}

export default DriverRankings; 