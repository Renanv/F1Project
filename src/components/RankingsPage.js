import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Box, Card, CardContent, useTheme, useMediaQuery, ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import FileUpload from './FileUpload';
import axiosInstance from '../utils/axiosInstance';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [selectedRaceId, setSelectedRaceId] = useState('');

  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');

  const [rankingType, setRankingType] = useState('driver');

  // Keep selectedChampionshipObject as it might be useful for other features
  const [selectedChampionshipObject, setSelectedChampionshipObject] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch championships using React Query
  const {
    data: championshipsList = [],
    isLoading: isLoadingChampionships,
    error: championshipsError
  } = useQuery({
    queryKey: ['championships'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/championships');
      return res.data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        if (!selectedChampionshipId || !data.find(c => c.id === selectedChampionshipId)) {
          setSelectedChampionshipId(data[0].id);
        }
      } else {
        setSelectedChampionshipId('');
      }
    },
    onError: (err) => {
      console.error('Error fetching championships:', err);
    }
  });

  // Fetch driver rankings using React Query
  const {
    data: drivers = [],
    isLoading: isLoadingDriverRankings,
    error: driverRankingsError,
  } = useQuery({
    queryKey: ['driverRankings', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const driversRes = await axiosInstance.get(`/api/drivers?championshipId=${selectedChampionshipId}`);
      return driversRes.data;
    },
    enabled: !!selectedChampionshipId && (rankingType === 'driver' || rankingType === 'constructors'),
    onError: (err) => {
      console.error('Error fetching driver rankings:', err);
    }
  });

  // Fetch team rankings using React Query
  const {
    data: teamRankings = [],
    isLoading: isLoadingTeamRankings,
    error: teamRankingsError,
  } = useQuery({
    queryKey: ['teamRankings', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const teamRes = await axiosInstance.get(`/api/team-rankings?championshipId=${selectedChampionshipId}`);
      return teamRes.data;
    },
    enabled: !!selectedChampionshipId && rankingType === 'team',
    onError: (err) => {
      console.error('Error fetching team rankings:', err);
    }
  });

  // Fetch races list for admin using React Query
  const {
    data: racesList = [], // Default to empty array
    isLoading: isLoadingAdminRaces,
    error: adminRacesError
  } = useQuery({
    queryKey: ['adminRacesList'],
    queryFn: async () => {
      const racesRes = await axiosInstance.get('/api/races/list');
      return racesRes.data || [];
    },
    enabled: !!isAdmin, // Only fetch if the user is an admin
    onError: (err) => {
      console.error('Error fetching races list for admin:', err);
      // Error is handled by adminRacesError
    }
  });

  useEffect(() => {
    const currentChamp = championshipsList.find(c => c.id === selectedChampionshipId);
    setSelectedChampionshipObject(currentChamp || null);

    // Data fetching is now handled by useQuery hooks based on selectedChampionshipId and rankingType
  }, [selectedChampionshipId, championshipsList, rankingType]);

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
    // Consolidated loading check for all relevant queries
    const overallLoading = isLoadingChampionships || 
                         (rankingType === 'driver' || rankingType === 'constructors' ? isLoadingDriverRankings : false) || 
                         (rankingType === 'team' ? isLoadingTeamRankings : false);

    if (overallLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>;
    }
    
    // Handle championships loading error first
    if (championshipsError) {
      return <Alert severity="error" sx={{mt: 2}} onClose={() => queryClient.resetQueries({ queryKey: ['championships'] })}><Localized id={'fetch-championships-error'} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
    }

    // Handle rankings-specific errors
    if (rankingType === 'driver' || rankingType === 'constructors') {
      if (driverRankingsError) {
        return <Alert severity="error" sx={{mt: 2}} onClose={() => queryClient.resetQueries({ queryKey: ['driverRankings', selectedChampionshipId] })}><Localized id={'fetch-rankings-error'} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
      }
    } else if (rankingType === 'team') {
      if (teamRankingsError) {
        return <Alert severity="error" sx={{mt: 2}} onClose={() => queryClient.resetQueries({ queryKey: ['teamRankings', selectedChampionshipId] })}><Localized id={'fetch-team-rankings-error'} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
      }
    }
    
    if (!selectedChampionshipId && !isLoadingChampionships) { 
        return <Typography sx={{mt: 2}}><Localized id="admin-select-championship-prompt" /></Typography>;
    }

    if (rankingType === 'driver') {
        return <DriverRankingsView drivers={drivers} isMobile={isMobile} />;
    } else if (rankingType === 'team') {
        return <TeamRankingsView teamRankings={teamRankings} isMobile={isMobile} />;
    } else if (rankingType === 'constructors') {
        return <ConstructorsRankingsView drivers={drivers} isMobile={isMobile} constructorTiers={constructorTiers} />;
    }

    if ((rankingType === 'driver' && drivers.length === 0 && !isLoadingDriverRankings) || 
        (rankingType === 'team' && teamRankings.length === 0 && !isLoadingTeamRankings) ||
        (rankingType === 'constructors' && drivers.length === 0 && !isLoadingDriverRankings) // Also check for constructors
        ) {
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
        <FormControl fullWidth disabled={isLoadingChampionships || isLoadingDriverRankings || isLoadingTeamRankings}>
            <InputLabel id="championship-select-label"><Localized id="select-championship-label" /></InputLabel>
            <Select
                labelId="championship-select-label"
                value={selectedChampionshipId}
                label={<Localized id="select-championship-label" />}
                onChange={handleChampionshipChange}
            >
                {isLoadingChampionships && (
                    <MenuItem value="" disabled>
                         <em><Localized id="loading-championships" /></em>
                    </MenuItem>
                )}
                {!isLoadingChampionships && championshipsList.length === 0 && (
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
                        <FormControl fullWidth disabled={isLoadingAdminRaces || championshipsList.length === 0 || !selectedChampionshipId}>
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
                                {racesList.length === 0 && !isLoadingAdminRaces && (
                                    <MenuItem value="" disabled>
                                        <em><Localized id="no-races-for-upload" /></em>
                                    </MenuItem>
                                )}
                                {/* Display error if admin races fetching failed */}
                                {adminRacesError && (
                                    <MenuItem value="" disabled sx={{color: 'error.main'}}>
                                        <em><Localized id="fetch-admin-races-error" fallback="Error loading races"/></em>
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Box>
                    <FileUpload 
                        onSuccess={() => {
                            if (!selectedChampionshipId) return;
                            if (rankingType === 'driver' || rankingType === 'constructors') {
                                queryClient.invalidateQueries({ queryKey: ['driverRankings', selectedChampionshipId] });
                            }
                            if (rankingType === 'team') {
                                queryClient.invalidateQueries({ queryKey: ['teamRankings', selectedChampionshipId] });
                            }
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