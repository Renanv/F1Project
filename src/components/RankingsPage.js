import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Box, Card, CardContent, useTheme, useMediaQuery, ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FileUpload from './FileUpload';
import axiosInstance from '../utils/axiosInstance';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import { constructorTiers } from '../utils/constructors'; // Import from new location

// Import the new view components
import DriverRankingsView from './rankings/DriverRankingsView';
import TeamRankingsView from './rankings/TeamRankingsView';
import ConstructorsRankingsView from './rankings/ConstructorsRankingsView';
import ClashesView from './rankings/ClashesView';
import BeautifulPlayRankingsView from './rankings/BeautifulPlayRankingsView';

// Define Constructor Tiers for Score-based ranking
// const constructorTiers = [
//     { ranks: [1, 2], name: "Red Bull", color: '#0600EF' },
//     { ranks: [3, 4], name: "McLaren", color: '#FF8700' },
//     { ranks: [5, 6], name: "Ferrari", color: '#DC0000' },
//     { ranks: [7, 8], name: "Mercedes", color: '#00D2BE' },
//     { ranks: [9, 10], name: "Aston Martin", color: '#006F62' },
//     { ranks: [11, 12], name: "Alpine", color: '#0090FF' },
//     { ranks: [13, 14], name: "VCARB", color: '#00BFFF' }, // Visa Cash App RB
//     { ranks: [15, 16], name: "Haas", color: '#FFFFFF', textColor: '#000000' },
//     { ranks: [17, 18], name: "Williams", color: '#005AFF' },
//     { ranks: [19, 20], name: "Sauber", color: '#00E100' } // Kick Sauber
// ];

function RankingsPage({ isAdmin }) {
  const queryClient = useQueryClient();
  const [selectedRaceId, setSelectedRaceId] = useState('');

  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');

  const [rankingType, setRankingType] = useState('driver');

  // selectedChampionshipObject is now computed with useMemo below

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch championships using React Query with grouping
  const {
    data: championshipsData = [],
    isLoading: isLoadingChampionships,
    error: championshipsError
  } = useQuery({
    queryKey: ['championships', 'grouped'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/championships?groupByStatus=true');
      return res.data;
    },
    onError: (err) => {
      console.error('Error fetching championships:', err);
    }
  });

  // Process grouped data for dropdown
  const championshipsList = React.useMemo(() => {
    if (!championshipsData.grouped) {
      return championshipsData; // Fallback to flat list
    }
    
    // Convert grouped data to flat list for compatibility
    const flatList = [];
    const statusOrder = ['RUNNING', 'FINISHED', 'HIDDEN'];
    
    statusOrder.forEach(status => {
      if (championshipsData.data[status]) {
        flatList.push(...championshipsData.data[status]);
      }
    });
    
    return flatList;
  }, [championshipsData]);

  useEffect(() => {
    if (championshipsList && championshipsList.length > 0) {
      if (!selectedChampionshipId || !championshipsList.find(c => c.id === selectedChampionshipId)) {
        setSelectedChampionshipId(championshipsList[0].id);
      }
    } else if (!isLoadingChampionships && (!championshipsList || championshipsList.length === 0)) {
      setSelectedChampionshipId('');
    }
  }, [championshipsList, isLoadingChampionships, selectedChampionshipId]);

  // Fetch championship winners for finished championships using React Query
  const {
    data: championshipWinners = null,
    isLoading: isLoadingWinners,
    error: winnersError
  } = useQuery({
    queryKey: ['championshipWinners', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return null;
      const res = await axiosInstance.get(`/api/championships/${selectedChampionshipId}/winners`);
      return res.data.data;
    },
    enabled: !!selectedChampionshipId,
    onError: (err) => {
      console.error('Error fetching championship winners:', err);
    }
  });

  // Get the selected championship object to check status
  const selectedChampionshipObject = useMemo(() => {
    return championshipsList.find(c => c.id === selectedChampionshipId) || null;
  }, [championshipsList, selectedChampionshipId]);

  // Get championship configuration for constructors ranking
  const championshipConfig = useMemo(() => {
    return selectedChampionshipObject ? {
      constructors_ranking_mode: selectedChampionshipObject.constructors_ranking_mode || 'individual',
      constructors_livery_order: selectedChampionshipObject.constructors_livery_order || 'normal'
    } : null;
  }, [selectedChampionshipObject]);

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

  // Fetch points by race data for driver rankings
  const {
    data: pointsByRaceData = null,
    isLoading: isLoadingPointsByRace,
    error: pointsByRaceError,
  } = useQuery({
    queryKey: ['pointsByRace', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return null;
      const response = await axiosInstance.get(`/api/championships/${selectedChampionshipId}/points-by-race`);
      return response.data.success ? response.data.data : null;
    },
    enabled: !!selectedChampionshipId && rankingType === 'driver',
    onError: (err) => {
      console.error('Error fetching points by race data:', err);
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

  // Fetch Beautiful Play rankings using React Query
  const {
    data: beautifulPlayRankings = [],
    isLoading: isLoadingBeautifulPlayRankings,
    error: beautifulPlayRankingsError,
  } = useQuery({
    queryKey: ['beautifulPlayRankings', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const response = await axiosInstance.get(`/api/beautiful-play-rankings?championshipId=${selectedChampionshipId}`);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!selectedChampionshipId && rankingType === 'beautiful-play',
    onError: (err) => {
      console.error('Error fetching Beautiful Play rankings:', err);
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

  // selectedChampionshipObject is now computed with useMemo - no useEffect needed

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
                         (rankingType === 'driver' ? isLoadingPointsByRace : false) ||
                         (rankingType === 'team' ? isLoadingTeamRankings : false) ||
                         (rankingType === 'beautiful-play' ? isLoadingBeautifulPlayRankings : false);

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
      if (rankingType === 'driver' && pointsByRaceError) {
        return <Alert severity="error" sx={{mt: 2}} onClose={() => queryClient.resetQueries({ queryKey: ['pointsByRace', selectedChampionshipId] })}><Localized id={'fetch-points-by-race-error'} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
      }
    } else if (rankingType === 'team') {
      if (teamRankingsError) {
        return <Alert severity="error" sx={{mt: 2}} onClose={() => queryClient.resetQueries({ queryKey: ['teamRankings', selectedChampionshipId] })}><Localized id={'fetch-team-rankings-error'} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
      }
    } else if (rankingType === 'beautiful-play') {
      if (beautifulPlayRankingsError) {
        return <Alert severity="error" sx={{mt: 2}} onClose={() => queryClient.resetQueries({ queryKey: ['beautifulPlayRankings', selectedChampionshipId] })}><Localized id={'fetch-beautiful-play-rankings-error'} fallback={<Localized id='generic-error-fallback' />} /></Alert>;
      }
    }
    
    if (!selectedChampionshipId && !isLoadingChampionships) { 
        return <Typography sx={{mt: 2}}><Localized id="admin-select-championship-prompt" /></Typography>;
    }

    if (rankingType === 'driver') {
        return <DriverRankingsView 
          drivers={drivers} 
          isMobile={isMobile} 
          races={pointsByRaceData?.races || []}
          pointsByRaceData={pointsByRaceData}
        />;
    } else if (rankingType === 'team') {
        return <TeamRankingsView teamRankings={teamRankings} isMobile={isMobile} />;
    } else if (rankingType === 'constructors') {
        return <ConstructorsRankingsView drivers={drivers} isMobile={isMobile} championshipConfig={championshipConfig} />;
    } else if (rankingType === 'clashes') {
        return <ClashesView championshipId={selectedChampionshipId} isAdmin={isAdmin} />;
    } else if (rankingType === 'beautiful-play') {
        return <BeautifulPlayRankingsView beautifulPlayData={beautifulPlayRankings} isMobile={isMobile} />;
    }

    if ((rankingType === 'driver' && drivers.length === 0 && !isLoadingDriverRankings) || 
        (rankingType === 'team' && teamRankings.length === 0 && !isLoadingTeamRankings) ||
        (rankingType === 'constructors' && drivers.length === 0 && !isLoadingDriverRankings) || // Also check for constructors
        (rankingType === 'beautiful-play' && beautifulPlayRankings.length === 0 && !isLoadingBeautifulPlayRankings)
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
          <ToggleButton value="clashes" aria-label="Clashes Rankings">
            <GroupWorkIcon sx={{ mr: isMobile ? 0 : 1}} /> 
            {!isMobile && <Localized id="rankings-clashes-tab" />}
          </ToggleButton>
          <ToggleButton value="beautiful-play" aria-label="Beautiful Play Rankings">
            <EmojiEventsIcon sx={{ mr: isMobile ? 0 : 1}} /> 
            {!isMobile && <Localized id="ranking-type-beautiful-play" fallback="Beautiful Play"/>}
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
                {!isLoadingChampionships && championshipsData.grouped && (() => {
                    const statusOrder = ['RUNNING', 'FINISHED', 'HIDDEN'];
                    const items = [];
                    
                    statusOrder.forEach(status => {
                        if (championshipsData.data[status] && championshipsData.data[status].length > 0) {
                            // Add status header
                            items.push(
                                <MenuItem key={`header-${status}`} disabled sx={{ 
                                    fontWeight: 'bold', 
                                    backgroundColor: 'action.hover',
                                    '&.Mui-disabled': { opacity: 1 }
                                }}>
                                    <Localized id={`championship-status-${status.toLowerCase()}`} fallback={status} />
                                </MenuItem>
                            );
                            
                            // Add championships for this status
                            championshipsData.data[status].forEach(champ => {
                                items.push(
                                    <MenuItem key={champ.id} value={champ.id} sx={{ pl: 3 }}>
                                        {champ.name}
                                    </MenuItem>
                                );
                            });
                        }
                    });
                    
                    return items;
                })()}
                {!isLoadingChampionships && !championshipsData.grouped && championshipsList.map((champ) => (
                    <MenuItem key={champ.id} value={champ.id}>{champ.name}</MenuItem>
                ))}
            </Select>
        </FormControl>
      </Box>

      {/* Winner Cards for Finished Championships */}
      {selectedChampionshipObject?.status === 'FINISHED' && championshipWinners && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
            <Localized id="championship-winners-title" />
          </Typography>
          
          {/* Driver Winners */}
          {(rankingType === 'driver' || rankingType === 'constructors') && championshipWinners.topDrivers && championshipWinners.topDrivers.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {championshipWinners.topDrivers.slice(0, 3).map((driver, index) => (
                <Grid item xs={12} sm={4} key={driver.user_id}>
                  <Card sx={{ 
                    textAlign: 'center',
                    background: index === 0 ? 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)' :
                               index === 1 ? 'linear-gradient(45deg, #C0C0C0 30%, #A0A0A0 90%)' :
                               'linear-gradient(45deg, #CD7F32 30%, #B8860B 90%)',
                    color: 'white',
                    boxShadow: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" component="h3">
                        <Localized 
                          id={`championship-position-${index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}`} 
                        />
                      </Typography>
                      <Typography variant="h5" component="h2" sx={{ my: 1 }}>
                        {driver.name}
                      </Typography>
                      <Typography variant="body1">
                        #{driver.driver_number}
                      </Typography>
                      {driver.team_name && (
                        <Typography variant="body2">
                          {driver.team_name}
                        </Typography>
                      )}
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {driver.total_points} pts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Team Winner */}
          {rankingType === 'team' && championshipWinners.winningTeam && (
            <Grid container justifyContent="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ 
                  textAlign: 'center',
                  background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
                  color: 'white',
                  boxShadow: 3
                }}>
                  <CardContent>
                    <Typography variant="h6" component="h3">
                      <Localized id="championship-constructors-champion" />
                    </Typography>
                    <Typography variant="h4" component="h2" sx={{ my: 2 }}>
                      {championshipWinners.winningTeam.team_name}
                    </Typography>
                    <Typography variant="h6">
                      {championshipWinners.winningTeam.total_team_points} pts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      <Grid container spacing={4}>
          <Grid item xs={12} md={isAdmin && !isMobile && selectedChampionshipObject?.status !== 'FINISHED' ? 8 : 12}> 
            {renderRankingsDisplay()} 
          </Grid>
          {isAdmin && !isMobile && selectedChampionshipObject?.status !== 'FINISHED' && (
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
                                queryClient.invalidateQueries({ queryKey: ['pointsByRace', selectedChampionshipId] });
                            }
                            if (rankingType === 'team') {
                                queryClient.invalidateQueries({ queryKey: ['teamRankings', selectedChampionshipId] });
                            }
                            if (rankingType === 'beautiful-play') {
                                queryClient.invalidateQueries({ queryKey: ['beautifulPlayRankings', selectedChampionshipId] });
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