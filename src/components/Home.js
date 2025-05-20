import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Localized } from '@fluent/react';
import {
  Container, Typography, Button, Grid, Card, CardContent, CardActionArea, Box, CircularProgress, Alert, Avatar, List, ListItem, ListItemText, ListItemIcon, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';
import axiosInstance from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { useQuery } from '@tanstack/react-query';
import UserStatusCard from './UserStatusCard'; // Import the new component
import { bonusSourceOptions } from '../utils/bonusSourceOptions'; // Import from shared location

// Define dashboard items
const dashboardItems = {
  user: [
    { id: 'rankings', titleId: 'driver-rankings-title', path: '/drivers', icon: <LeaderboardIcon fontSize="large" /> },
    { id: 'account', titleId: 'account-link', path: '/account', icon: <AccountCircleIcon fontSize="large" /> },
  ],
  admin: [
    { id: 'adminPanel', titleId: 'admin-panel-link', path: '/admin', icon: <AdminPanelSettingsIcon fontSize="large" /> },
    // Add other admin links if needed, e.g., direct link to config
    // { id: 'config', titleId: 'admin-config-title', path: '/config', icon: <SettingsIcon fontSize="large" /> },
  ]
};

// Copied from ChampionshipManager.js for displaying log sources
// const bonusSourceOptions = [ // REMOVE THIS LOCAL DEFINITION
//   { value: 'MANUAL_ADJUSTMENT', label: 'Manual Admin Adjustment' },
//   { value: 'CLASH', label: 'Clash' },
//   { value: 'FASTEST_LAP', label: 'Fastest Lap' },
//   { value: 'DRIVER_OF_THE_DAY', label: 'Driver of the Day' },
//   { value: 'RACE_INCIDENT_PENALTY', label: 'Race Incident Penalty' },
//   { value: 'OTHER', label: 'Other (Specify in Reason)' },
// ];

function Home({ isLoggedIn, isAdmin }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');

  // State for User's Bonus Log Modal
  const [openUserBonusLogDialog, setOpenUserBonusLogDialog] = useState(false);
  const [userBonusLogAttendeeName, setUserBonusLogAttendeeName] = useState(''); // For dialog title

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  };

  // Fetch list of all participated championships using React Query
  const { 
    data: championshipsList = [],
    isLoading: isLoadingChampionshipsList,
    error: championshipsListError
  } = useQuery({
    queryKey: ['participatedChampionships'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/users/me/participated-championships');
      return response.data;
    },
    enabled: !!isLoggedIn, 
    onSuccess: (data) => {
      if (data && data.length > 0) {
        if (!selectedChampionshipId || !data.find(c => c.id === selectedChampionshipId)){
            setSelectedChampionshipId(data[0].id);
        }
      } else {
        setSelectedChampionshipId('');
      }
    },
  });

  // Memoize the current championship data from the query result
  const currentChampionship = useMemo(() => 
    championshipsList.find(c => c.id === selectedChampionshipId),
    [championshipsList, selectedChampionshipId]
  );

  const userId = useMemo(() => getUserIdFromToken(), [isLoggedIn]); // Memoize userId too

  // Fetch user status based on selected championship using React Query
  const { 
    data: userStatus,
    isLoading: isLoadingUserStatus,
    error: userStatusError,
    // refetch: refetchUserStatus // Can be used if manual refetch is needed elsewhere
  } = useQuery({
    queryKey: ['userStatus', selectedChampionshipId, userId],
    queryFn: async () => {
      if (!selectedChampionshipId || !userId) return null; // Should be handled by enabled, but defensive

      const [rankingsResponse, lastRaceResponse] = await Promise.all([
        axiosInstance.get(`/api/drivers?championshipId=${selectedChampionshipId}`),
        axiosInstance.get(`/api/users/me/last-race-result?championshipId=${selectedChampionshipId}`)
      ]);

      const rankings = rankingsResponse.data;
      const userDriverInfo = rankings.find(d => d.user_id === userId);
      
      let rank = null, totalPoints = null, bonusPoints = 0, calculatedTeammatePoints = 0, teamId = null, teamName = null, attendeeId = null, userTag = null;
      
      if (userDriverInfo) {
        rank = rankings.findIndex(d => d.user_id === userId) + 1;
        totalPoints = (userDriverInfo.points || 0) + (userDriverInfo.bonus_points || 0);
        bonusPoints = userDriverInfo.bonus_points || 0;
        teamId = userDriverInfo.team_id;
        teamName = userDriverInfo.team_name;
        attendeeId = userDriverInfo.id; 
        userTag = userDriverInfo.name;

        if (teamId) {
          calculatedTeammatePoints = rankings
            .filter(d => d.team_id === teamId && d.user_id !== userId)
            .reduce((sum, d) => sum + ((d.points || 0) + (d.bonus_points || 0)), 0);
        }
      }

      const lastRace = lastRaceResponse.data.success ? lastRaceResponse.data.lastRace : null;
      const currentChampFromList = championshipsList.find(c => c.id === selectedChampionshipId); // Get current champ name from the list

      return {
        rank: rank,
        points: totalPoints,
        bonusPoints: bonusPoints,
        attendeeId: attendeeId,
        userTag: userTag, 
        teammatePoints: calculatedTeammatePoints,
        lastRace,
        championshipName: currentChampFromList?.name, // Use name from already fetched list
        teamName: teamName,
        noChampionships: championshipsList.length === 0 && !isLoadingChampionshipsList && !championshipsListError // Indicate if no championships
      };
    },
    enabled: !!isLoggedIn && !!selectedChampionshipId && !!userId && !isLoadingChampionshipsList, // Enable only when all dependencies are ready
  });

  // Memoize the user's team data from userStatus (which is now query data)
  const userTeamData = useMemo(() => {
    if (!userStatus) return null;
    return {
      teamName: userStatus.teamName,
      teammatePoints: userStatus.teammatePoints
    };
  }, [userStatus]);

  // Memoize the last race data from userStatus (which is now query data)
  const lastRaceData = useMemo(() => {
    if (!userStatus?.lastRace) return null;
    return {
      raceName: userStatus.lastRace.race_title,
      date: userStatus.lastRace.race_date,
      position: userStatus.lastRace.position,
      fastestLap: userStatus.lastRace.fastest_lap,
      isOverallFastestLap: userStatus.lastRace.isOverallFastestLap
    };
  }, [userStatus?.lastRace]);

  // --- User Bonus Log Query ---
  const {
    data: userBonusLogEntries = [], // Default to empty array
    isLoading: isLoadingUserBonusLog,
    error: userBonusLogError,
    // refetch: refetchUserBonusLog // if needed for manual refresh
  } = useQuery({
    queryKey: ['userBonusLog', userStatus?.attendeeId],
    queryFn: async () => {
      if (!userStatus?.attendeeId) return []; // Should be caught by enabled, but defensive
      const response = await axiosInstance.get(`/api/championship-attendees/${userStatus.attendeeId}/bonus-points-log`);
      return response.data;
    },
    enabled: openUserBonusLogDialog && !!userStatus?.attendeeId, // Only fetch when dialog is open and attendeeId is available
  });

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
      console.log('beforeinstallprompt event captured.');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleChampionshipChange = (event) => {
    setSelectedChampionshipId(event.target.value);
  };

  const handleOpenUserBonusLogDialog = async () => {
    if (!userStatus?.attendeeId) {
      // It's better to handle this via disabling the button or showing a message
      // rather than setting an error here, as the query won't run anyway.
      console.warn('Cannot open bonus log: Attendee ID not found.');
      return;
    }
    
    const nameForLog = userStatus?.userTag || 'Your'; 
    setUserBonusLogAttendeeName(nameForLog); 
    setOpenUserBonusLogDialog(true);
    // Data fetching is now handled by the useQuery based on openUserBonusLogDialog and userStatus.attendeeId
  };

  const handleCloseUserBonusLogDialog = () => {
    setOpenUserBonusLogDialog(false);
    // setUserBonusLogError(null); // Optional: clear error on close
  };

  const renderDashboardCard = (item) => (
    <Grid item xs={12} sm={6} md={4} key={item.id}>
      <Card sx={{ height: '100%' }}>
        <CardActionArea component={RouterLink} to={item.path} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            {item.icon}
            <Typography variant="h6" component="div" sx={{ mt: 1 }}>
              <Localized id={item.titleId} />
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {isLoggedIn && (
        <Box mb={4}>
          {isLoadingChampionshipsList && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} /></Box>}
          {championshipsListError && <Alert severity="error" sx={{my: 2}}><Localized id="fetch-championships-list-error" fallback="Failed to load championships list." /></Alert>}
          {!isLoadingChampionshipsList && !championshipsListError && championshipsList.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="championship-select-label"><Localized id="select-championship-label" /></InputLabel>
              <Select
                labelId="championship-select-label"
                id="championship-select"
                value={selectedChampionshipId}
                label={<Localized id="select-championship-label" />}
                onChange={handleChampionshipChange}
                disabled={isLoadingUserStatus}
              >
                {championshipsList.map((champ) => (
                  <MenuItem key={champ.id} value={champ.id}>
                    {champ.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {!isLoadingChampionshipsList && !championshipsListError && championshipsList.length === 0 && isLoggedIn && (
             <Typography variant="subtitle1" color="text.secondary" sx={{textAlign: 'center', my: 2}}>
                <Localized id="no-participated-championships" />
            </Typography>
          )}

          {/* User Status Section */}
          {isLoadingUserStatus && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
          {userStatusError && <Alert severity="error" sx={{ my: 2 }}><Localized id="fetch-user-status-error" fallback="Failed to load user status."/></Alert>}
          
          {/* Display UserStatusCard when data is available, not loading, no error, and a championship is selected */}
          {userStatus && !isLoadingUserStatus && !userStatusError && selectedChampionshipId && !userStatus.noChampionships && (
            <UserStatusCard 
              status={userStatus}
              teamData={userTeamData}
              raceData={lastRaceData}
              onOpenBonusLog={handleOpenUserBonusLogDialog}
            />
          )}
          {/* Handle case where user has no championships at all (derived from userStatus.noChampionships) */}
          {userStatus && userStatus.noChampionships && !isLoadingUserStatus && !userStatusError && (
             <Typography variant="subtitle1" color="text.secondary" sx={{textAlign: 'center', my: 2}}>
                <Localized id="no-championships-for-status" />
            </Typography>
          )}
           {/* Handle case where championships list is loaded, but nothing is selected (e.g. if list was empty initially) */}
          {!selectedChampionshipId && !isLoadingChampionshipsList && championshipsList.length > 0 && !isLoadingUserStatus && (
             <Typography variant="subtitle1" color="text.secondary" sx={{textAlign: 'center', my: 2}}>
                <Localized id="please-select-championship-status" />
            </Typography>
          )}
        </Box>
      )}

      {showInstallButton && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleInstallClick}
            startIcon={<AddToHomeScreenIcon />}
          >
            <Localized id="install-app-button" />
          </Button>
        </Box>
      )}

      {isLoggedIn ? (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <Localized id="dashboard-title" />
          </Typography>
          <Grid container spacing={3}>
            {dashboardItems.user.map(renderDashboardCard)}
            {isAdmin && dashboardItems.admin.map(renderDashboardCard)}
          </Grid>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            <Localized id="welcome-message" />
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            <Localized id="login-or-register-prompt" />
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                component={RouterLink} 
                to="/login"
                startIcon={<LoginIcon />}
              >
                <Localized id="login" />
              </Button>
            </Grid>
            <Grid item>
              <Button 
                variant="outlined" 
                color="secondary" 
                size="large" 
                component={RouterLink} 
                to="/register"
                startIcon={<AppRegistrationIcon />}
              >
                <Localized id="register" />
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* User's Bonus Points Log Dialog */}
      {openUserBonusLogDialog && userStatus?.attendeeId && (
        <Dialog open={openUserBonusLogDialog} onClose={handleCloseUserBonusLogDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Localized 
              id="admin-bonus-points-log-title" // Reusing existing key
              vars={{ userName: userBonusLogAttendeeName }} 
              fallback={`Bonus Points Log for ${userBonusLogAttendeeName}`}
            />
          </DialogTitle>
          <DialogContent>
            {isLoadingUserBonusLog ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
            ) : userBonusLogError ? (
              <Alert severity="error" onClose={() => { /* Consider queryClient.resetQueries(['userBonusLog', userStatus?.attendeeId]) or similar if needed */ }}> 
                <Localized id={userBonusLogError.message || 'fetch-bonus-log-error'} fallback={<Localized id='generic-error-fallback' />} />
              </Alert>
            ) : userBonusLogEntries.length === 0 ? (
              <Typography><Localized id="admin-no-bonus-log-entries" fallback="No bonus point entries found."/></Typography>
            ) : (
              <Paper sx={{ mt: 1, maxHeight: '400px', overflow: 'auto' }}>
                <TableContainer component={Paper} sx={{ mt: 1}}>
                  <Table stickyHeader size="small" aria-label="user bonus points log table">
                    <TableHead>
                      <TableRow>
                        <TableCell><Localized id="bonus-log-points-header" /></TableCell>
                        <TableCell><Localized id="bonus-log-source-header" /></TableCell>
                        <TableCell><Localized id="bonus-log-reason-header" /></TableCell>
                        <TableCell><Localized id="bonus-log-awarded-at-header" /></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userBonusLogEntries.map((entry) => (
                        <TableRow hover key={entry.id}>
                          <TableCell>{entry.points_awarded}</TableCell>
                          <TableCell>
                            <Localized 
                              id={`bonus-source-${entry.source}`} 
                              fallback={bonusSourceOptions.find(opt => opt.value === entry.source)?.label || entry.source.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())} 
                            />
                          </TableCell>
                          <TableCell>{entry.reason || '-'}</TableCell>
                          <TableCell>{new Date(entry.awarded_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseUserBonusLogDialog}>
              <Localized id="admin-close-button" fallback="Close"/>
            </Button>
          </DialogActions>
        </Dialog>
      )}

    </Container>
  );
}

export default Home;