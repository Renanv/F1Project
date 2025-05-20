import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Localized } from '@fluent/react';
import {
  Container, Typography, Button, Grid, Card, CardContent, CardActionArea, Box, CircularProgress, Alert, Avatar, List, ListItem, ListItemText, ListItemIcon, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import GroupIcon from '@mui/icons-material/Group';
import TimerIcon from '@mui/icons-material/Timer';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import EventIcon from '@mui/icons-material/Event';
import axiosInstance from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';

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

function Home({ isLoggedIn, isAdmin }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [championshipsList, setChampionshipsList] = useState([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');

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

  // Fetch list of all championships
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchChampionships = async () => {
      try {
        const response = await axiosInstance.get('/api/championships');
        if (response.data && response.data.length > 0) {
          const sortedChampionships = [...response.data].sort((a, b) => b.id - a.id); // Sort by ID desc for latest first
          setChampionshipsList(sortedChampionships);
          setSelectedChampionshipId(sortedChampionships[0].id); // Default to the latest one
        } else {
          setChampionshipsList([]);
          setUserStatus({ noChampionships: true }); // To display a message
        }
      } catch (error) {
        console.error("Error fetching championships list:", error);
        setStatusError('Failed to load championships list.');
        setChampionshipsList([]);
      }
    };
    fetchChampionships();
  }, [isLoggedIn]);

  // Memoize the current championship data
  const currentChampionship = useMemo(() => 
    championshipsList.find(c => c.id === selectedChampionshipId),
    [championshipsList, selectedChampionshipId]
  );

  // Memoize the user's team data
  const userTeamData = useMemo(() => {
    if (!userStatus) return null;
    return {
      teamName: userStatus.teamName,
      teammatePoints: userStatus.teammatePoints
    };
  }, [userStatus]);

  // Memoize the last race data
  const lastRaceData = useMemo(() => {
    if (!userStatus?.lastRace) return null;
    return {
      raceName: userStatus.lastRace.title,
      date: userStatus.lastRace.date,
      position: userStatus.lastRace.position,
      fastestLap: userStatus.lastRace.fastest_lap
    };
  }, [userStatus?.lastRace]);

  // Fetch user status based on selected championship
  const fetchUserStatus = useCallback(async () => {
    const currentSelectedChampionshipId = selectedChampionshipId;
    console.log(`[fetchUserStatus] START - Championship ID: ${currentSelectedChampionshipId}, Logged In: ${isLoggedIn}`);

    if (!isLoggedIn || !currentSelectedChampionshipId) {
      console.log(`[fetchUserStatus] Skipping fetch - Logged In: ${isLoggedIn}, Championship ID: ${currentSelectedChampionshipId}`);
      if (!currentSelectedChampionshipId && championshipsList.length > 0) {
        setUserStatus(null); 
      }
      return;
    }

    const currentUserId = getUserIdFromToken();
    if (!currentUserId) {
      setStatusError('Could not identify user.');
      console.log(`[fetchUserStatus] END - Error: Could not identify user.`);
      return;
    }

    setIsLoadingStatus(true);
    setStatusError(null);
    setUserStatus(null); 

    try {
      // Fetch rankings and last race result in parallel
      const [rankingsResponse, lastRaceResponse] = await Promise.all([
        axiosInstance.get(`/api/drivers?championshipId=${currentSelectedChampionshipId}`),
        axiosInstance.get(`/api/users/me/last-race-result?championshipId=${currentSelectedChampionshipId}`)
      ]);

      const rankings = rankingsResponse.data;
      const userDriverInfo = rankings.find(d => d.user_id === currentUserId);
      
      let userRank = null, userPoints = null, teammatePoints = 0, userTeamId = null, userTeamName = null;
      
      if (userDriverInfo) {
        userRank = rankings.findIndex(d => d.user_id === currentUserId) + 1;
        userPoints = userDriverInfo.points;
        userTeamId = userDriverInfo.team_id;
        userTeamName = userDriverInfo.team_name;

        if (userTeamId) {
          teammatePoints = rankings
            .filter(d => d.team_id === userTeamId && d.user_id !== currentUserId)
            .reduce((sum, d) => sum + d.points, 0);
        }
      }

      const lastRace = lastRaceResponse.data.success ? lastRaceResponse.data.lastRace : null;

      setUserStatus({
        rank: userRank,
        points: userPoints,
        teammatePoints,
        lastRace,
        championshipName: currentChampionship?.name,
        teamName: userTeamName
      });
    } catch (err) {
      console.error("Error fetching user status:", err);
      setStatusError('Error fetching user status');
    } finally {
      setIsLoadingStatus(false);
    }
  }, [selectedChampionshipId, isLoggedIn, championshipsList, currentChampionship]);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

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
          {championshipsList.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="championship-select-label"><Localized id="select-championship-label" /></InputLabel>
              <Select
                labelId="championship-select-label"
                id="championship-select"
                value={selectedChampionshipId}
                label={<Localized id="select-championship-label" />}
                onChange={handleChampionshipChange}
              >
                {championshipsList.map((champ) => (
                  <MenuItem key={champ.id} value={champ.id}>
                    {champ.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {isLoadingStatus && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
          {statusError && <Alert severity="error" sx={{ my: 2 }}>{statusError}</Alert>}
          
          {userStatus && !isLoadingStatus && !statusError && !userStatus.noChampionships && selectedChampionshipId && (
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom sx={{ textAlign: 'center' }}>
                  <Localized id="my-status-title" /> {userStatus.championshipName ? `(${userStatus.championshipName})` : ''}
                </Typography>
                <Grid container spacing={2} alignItems="stretch">
                  <Grid item xs={12} md={userStatus.lastRace ? 4 : 6}>
                    <Typography variant="h6" gutterBottom><Localized id="my-current-standing" /></Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><GroupIcon color="primary" /></ListItemIcon>
                        <ListItemText 
                          primary={<Localized id="team-label" />} 
                          secondary={userTeamData?.teamName ? userTeamData.teamName : <Localized id="team-name-not-available" />}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><SportsScoreIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={<Localized id="points-label" />} secondary={userStatus.points !== null ? userStatus.points : '0'} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><GroupIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={<Localized id="teammate-points-label" />} secondary={userTeamData?.teammatePoints !== null ? userTeamData.teammatePoints : '0'} />
                      </ListItem>
                    </List>
                  </Grid>

                  {userStatus.lastRace && (
                    <Grid item xs={12} md={4}>
                      { console.log('DEBUG userStatus.lastRace:', JSON.stringify(userStatus.lastRace, null, 2)) }
                      <Typography variant="h6" gutterBottom>
                        <Localized 
                          id="last-race-result-title" 
                          vars={{ raceName: lastRaceData?.raceName || '' }}
                        />
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><EventIcon color="secondary"/></ListItemIcon>
                          <ListItemText 
                            primary={<Localized id="race-date-label" />} 
                            secondary={
                              lastRaceData?.date 
                              ? new Date(lastRaceData.date).toLocaleDateString('en-GB') 
                              : 'N/A'
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><FormatListNumberedIcon color="secondary" /></ListItemIcon>
                          <ListItemText primary={<Localized id="position-label" />} secondary={lastRaceData?.position} />
                          {/* Conditionally add medal icon */} 
                          {lastRaceData && [1, 2, 3].includes(lastRaceData.position) && (
                            <EmojiEventsIcon sx={{
                              marginLeft: 'auto', // Push to the right
                              color: lastRaceData.position === 1 ? '#FFD700' // Gold
                                     : lastRaceData.position === 2 ? '#C0C0C0' // Silver
                                     : '#CD7F32' // Bronze
                            }} />
                          )}
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><TimerIcon color="secondary" /></ListItemIcon>
                          <ListItemText 
                            primary={<Localized id="fastest-lap-label" />} 
                            secondary={lastRaceData?.fastestLap || 'N/A'} 
                            secondaryTypographyProps={{
                              sx: {
                                color: lastRaceData.isOverallFastestLap ? 'secondary.main' : 'inherit',
                                fontWeight: lastRaceData.isOverallFastestLap ? 'bold' : 'normal' 
                              }
                            }}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  )}
                  <Grid item xs={12} md={userStatus.lastRace ? 4 : 6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Avatar sx={{
                          width: 100, 
                          height: 100, 
                          fontSize: '2rem',
                          bgcolor: userStatus.rank === 1 ? '#FFD700' // Gold
                                   : userStatus.rank === 2 ? '#C0C0C0' // Silver
                                   : userStatus.rank === 3 ? '#CD7F32' // Bronze
                                   : 'primary.main' // Default
                        }}>
                            {userStatus.rank !== null ? userStatus.rank : '-'}
                        </Avatar>
                    </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          {userStatus && userStatus.noChampionships && (
             <Typography variant="subtitle1" color="text.secondary" sx={{textAlign: 'center', my: 2}}>
                <Localized id="no-championships-for-status" />
            </Typography>
          )}
          {!selectedChampionshipId && championshipsList.length > 0 && !isLoadingStatus && (
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
    </Container>
  );
}

export default Home;