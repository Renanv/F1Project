import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Box, Card, CardContent, useTheme, useMediaQuery, ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import FileUpload from './FileUpload';
import axiosInstance from '../utils/axiosInstance';

// Import the new view components
import DriverRankingsView from './rankings/DriverRankingsView';
import TeamRankingsView from './rankings/TeamRankingsView';
import ConstructorsRankingsView from './rankings/ConstructorsRankingsView';

// Define Constructor Tiers for Score-based ranking
const constructorTiers = [
    { ranks: [1, 2], name: "Red Bull", color: '#0600EF' },
    { ranks: [3, 4], name: "McLaren", color: '#FF8700' },
    { ranks: [5, 6], name: "Ferrari", color: '#DC0000' },
    { ranks: [7, 8], name: "Mercedes", color: '#00D2BE' },
    { ranks: [9, 10], name: "Aston Martin", color: '#006F62' },
    { ranks: [11, 12], name: "Alpine", color: '#0090FF' },
    { ranks: [13, 14], name: "VCARB", color: '#00BFFF' }, // Visa Cash App RB
    { ranks: [15, 16], name: "Haas", color: '#FFFFFF', textColor: '#000000' },
    { ranks: [17, 18], name: "Williams", color: '#005AFF' },
    { ranks: [19, 20], name: "Sauber", color: '#00E100' } // Kick Sauber
];

function RankingsPage({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);
  const [teamRankings, setTeamRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [racesList, setRacesList] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(false);

  const [championshipsList, setChampionshipsList] = useState([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [loadingChampionships, setLoadingChampionships] = useState(true);

  const [rankingType, setRankingType] = useState('driver');

  // Keep selectedChampionshipObject as it might be useful for other features
  const [selectedChampionshipObject, setSelectedChampionshipObject] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchChampionships = useCallback(async () => {
    setLoadingChampionships(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/api/championships'); 
      setChampionshipsList(res.data);
      if (res.data.length > 0) {
        setSelectedChampionshipId(res.data[0].id); 
      } else {
        setSelectedChampionshipId('');
        setDrivers([]);
        setTeamRankings([]);
      }
    } catch (err) {
      console.error('Error fetching championships:', err);
      setError('fetch-championships-error');
    } finally {
      setLoadingChampionships(false);
    }
  }, []);

  const fetchDriverRankings = useCallback(async (championshipId) => {
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
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeamRankings = useCallback(async (championshipId) => {
    if (!championshipId) {
        setTeamRankings([]);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const teamRes = await axiosInstance.get(`/api/team-rankings?championshipId=${championshipId}`);
      setTeamRankings(teamRes.data);
    } catch (err) {
      console.error('Error fetching team rankings:', err);
      setError('fetch-team-rankings-error');
      setTeamRankings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChampionships();
  }, [fetchChampionships]);

  useEffect(() => {
    const currentChamp = championshipsList.find(c => c.id === selectedChampionshipId);
    setSelectedChampionshipObject(currentChamp || null);

    if (selectedChampionshipId) {
      if (rankingType === 'driver' || rankingType === 'constructors') {
        fetchDriverRankings(selectedChampionshipId);
      }
      if (rankingType === 'team') {
        fetchTeamRankings(selectedChampionshipId);
      }
    } else {
      setDrivers([]);
      setTeamRankings([]);
      setIsLoading(false);
    }
  }, [selectedChampionshipId, championshipsList, rankingType, fetchDriverRankings, fetchTeamRankings]);

  useEffect(() => {
    const fetchRacesForAdmin = async () => {
        if (!isAdmin) return;
        setLoadingRaces(true);
        try {
            const racesRes = await axiosInstance.get('/api/races/list');
            setRacesList(racesRes.data || []);
        } catch (err) {
            console.error('Error fetching races list for admin:', err);
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

  const handleRankingTypeChange = (event, newRankingType) => {
    if (newRankingType !== null) {
      setRankingType(newRankingType);
    }
  };

  const renderRankingsDisplay = () => {
    if (isLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>;
    }
    if (error && !loadingChampionships) {
      return <Alert severity="error" sx={{mt: 2}} onClose={() => setError(null)}><Localized id={error} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
    }
    if (!selectedChampionshipId && !loadingChampionships) { 
        return <Typography sx={{mt: 2}}><Localized id="admin-select-championship-prompt" /></Typography>;
    }

    if (rankingType === 'driver') {
        return <DriverRankingsView drivers={drivers} isMobile={isMobile} />;
    } else if (rankingType === 'team') {
        return <TeamRankingsView teamRankings={teamRankings} isMobile={isMobile} />;
    } else if (rankingType === 'constructors') {
        return <ConstructorsRankingsView drivers={drivers} isMobile={isMobile} constructorTiers={constructorTiers} />;
    }

    if ((rankingType === 'driver' && drivers.length === 0 && !isLoading) || 
        (rankingType === 'team' && teamRankings.length === 0 && !isLoading)) {
        return <Typography sx={{mt: 2}}><Localized id="no-data-for-ranking" fallback="No data available for the selected ranking type."/></Typography>;
    }
    
    return null; 
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom sx={{ mb: isMobile ? 1 : 0 }}>
          <Localized id="rankings-page-title" fallback="Rankings"/>
        </Typography>
        <ToggleButtonGroup
          value={rankingType}
          exclusive
          onChange={handleRankingTypeChange}
          aria-label="Ranking Type"
          size={isMobile ? "small" : "medium"}
        >
          <ToggleButton value="driver" aria-label="Driver Rankings">
            <PersonIcon sx={{ mr: isMobile ? 0 : 1}} />
            {!isMobile && <Localized id="ranking-type-driver" fallback="Drivers"/>}
          </ToggleButton>
          <ToggleButton value="team" aria-label="Team Rankings">
            <GroupIcon sx={{ mr: isMobile ? 0 : 1}} />
            {!isMobile && <Localized id="ranking-type-team" fallback="Teams"/>}
          </ToggleButton>
          <ToggleButton value="constructors" aria-label="Constructors Rankings">
            <AssignmentIcon sx={{ mr: isMobile ? 0 : 1}} />
            {!isMobile && <Localized id="ranking-type-constructors" fallback="Constructors"/>}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth disabled={loadingChampionships || isLoading}>
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
          <Grid item xs={12} md={isAdmin && !isMobile ? 8 : 12}> 
            {renderRankingsDisplay()} 
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
                        onSuccess={() => {
                            if (!selectedChampionshipId) return;
                            setIsLoading(true);
                            const refetchData = async () => {
                                if (rankingType === 'driver' || rankingType === 'constructors') {
                                    await fetchDriverRankings(selectedChampionshipId);
                                }
                                if (rankingType === 'team') {
                                    await fetchTeamRankings(selectedChampionshipId);
                                }
                                setIsLoading(false);
                            };
                            refetchData();
                        }} 
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

export default RankingsPage; 