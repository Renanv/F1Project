import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Localized } from '@fluent/react';
import {
  Container, Typography, Button, Grid, Card, CardContent, CardActionArea, Box, CircularProgress, Alert, Avatar, List, ListItem, ListItemText, ListItemIcon, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Skeleton
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GavelIcon from '@mui/icons-material/Gavel';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import axiosInstance from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import UserStatusCard from './UserStatusCard'; // Import the new component
import { bonusSourceOptions } from '../utils/bonusSourceOptions'; // Import from shared location
import { getCountryCodeForRace } from '../utils/raceToCountryCode';

// Define dashboard items
const dashboardItems = {
  user: [
    { id: 'rankings', titleId: 'driver-rankings-title', path: '/drivers', icon: <LeaderboardIcon fontSize="large" /> },
    { id: 'account', titleId: 'account-link', path: '/account', icon: <AccountCircleIcon fontSize="large" /> },
    { id: 'penalties', titleId: 'penalties-list-link', path: '/penalties', icon: <GavelIcon fontSize="large" /> },
    { id: 'community', titleId: 'community-page-link', path: '/community', icon: <OndemandVideoIcon fontSize="large" /> },
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
  const queryClient = useQueryClient();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(() => localStorage.getItem('home:selectedChampionshipId') || '');

  // State for User's Bonus Log Modal
  const [openUserBonusLogDialog, setOpenUserBonusLogDialog] = useState(false);
  
  // State for Registration Success Dialog
  const [openRegistrationSuccessDialog, setOpenRegistrationSuccessDialog] = useState(false);
  const [registrationSuccessData, setRegistrationSuccessData] = useState(null);
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
  });

  // Fetch running championships for homepage (all users can see these)
  const { 
    data: runningChampionshipsList = [],
    isLoading: isLoadingRunningChampionships,
    error: runningChampionshipsError
  } = useQuery({
    queryKey: ['runningChampionships'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/championships?forHomepage=true');
      return response.data;
    },
    enabled: true, // Always enabled for homepage display
  });

  // Fetch registering championships for registration cards
  const { 
    data: registeringChampionships = [],
    isLoading: isLoadingRegisteringChampionships,
    error: registeringChampionshipsError
  } = useQuery({
    queryKey: ['registeringChampionships'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/homepage/registration-status');
      return response.data.data || [];
    },
    enabled: true, // Always enabled to show registration opportunities
  });

  // Fetch user registration status for each registering championship
  const { 
    data: userRegistrationStatuses = {},
    isLoading: isLoadingRegistrationStatuses,
    error: registrationStatusesError
  } = useQuery({
    queryKey: ['userRegistrationStatuses', registeringChampionships.map(c => c.id)],
    queryFn: async () => {
      if (!isLoggedIn || registeringChampionships.length === 0) return {};
      
      const statusPromises = registeringChampionships.map(async (championship) => {
        try {
          const response = await axiosInstance.get(`/api/championships/${championship.id}/registration-status`);
          return { [championship.id]: response.data };
        } catch (error) {
          console.error(`Error fetching registration status for championship ${championship.id}:`, error);
          return { [championship.id]: { isRegistered: false, isReserve: false } };
        }
      });
      
      const statusResults = await Promise.all(statusPromises);
      return statusResults.reduce((acc, status) => ({ ...acc, ...status }), {});
    },
    enabled: isLoggedIn && registeringChampionships.length > 0,
  });

  useEffect(() => {
    // This effect runs when the list of running championships is successfully fetched or changes.
    if (runningChampionshipsList && runningChampionshipsList.length > 0) {
      // If no championship is currently selected, or if the selected one is no longer in the list,
      // default to the first available championship.
      if (!selectedChampionshipId || !runningChampionshipsList.find(c => c.id === selectedChampionshipId)) {
        setSelectedChampionshipId(runningChampionshipsList[0].id);
      }
    } else if (!isLoadingRunningChampionships && (!runningChampionshipsList || runningChampionshipsList.length === 0)) {
      // If loading is finished and the list is empty, ensure no championship is selected.
      setSelectedChampionshipId('');
    }
  }, [runningChampionshipsList, isLoadingRunningChampionships, selectedChampionshipId]);

  // Persist selection
  useEffect(() => {
    if (selectedChampionshipId) {
      localStorage.setItem('home:selectedChampionshipId', selectedChampionshipId);
    }
  }, [selectedChampionshipId]);

  // Memoize the current championship data from the query result
  const currentChampionship = useMemo(() => 
    runningChampionshipsList.find(c => c.id === selectedChampionshipId),
    [runningChampionshipsList, selectedChampionshipId]
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
      const currentChampFromList = runningChampionshipsList.find(c => c.id === selectedChampionshipId); // Get current champ name from the list

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
        noChampionships: runningChampionshipsList.length === 0 && !isLoadingRunningChampionships && !runningChampionshipsError // Indicate if no championships
      };
    },
    enabled: !!isLoggedIn && !!selectedChampionshipId && !!userId && !isLoadingRunningChampionships, // Enable only when all dependencies are ready
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

  // Fetch races for selected championship to determine next race
  const { data: racesForChampionship = [], isLoading: isLoadingRaces } = useQuery({
    queryKey: ['homeRaces', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const res = await axiosInstance.get(`/api/championships/${selectedChampionshipId}/races`);
      return res.data || [];
    },
    enabled: !!selectedChampionshipId
  });

  // Compute the UTC timestamp corresponding to 22:00 BRT (UTC-03:00) on the given race date
  const getRaceCutoffUtc = (dateStr) => {
    if (!dateStr) return null;
    const base = new Date(dateStr);
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const day = base.getUTCDate();
    // 22:00 BRT == 01:00 UTC next day when offset is -03:00
    return Date.UTC(year, month, day, 22 + 3, 0, 0);
  };

  const nextRace = useMemo(() => {
    if (!racesForChampionship || racesForChampionship.length === 0) return null;
    const nowMs = Date.now();
    const future = racesForChampionship
      .map((race) => {
        const cutoffMs = getRaceCutoffUtc(race.date);
        return cutoffMs ? { ...race, cutoffMs } : null;
      })
      .filter(Boolean)
      // Keep races whose 22:00 BRT cutoff is still in the future
      .filter((race) => race.cutoffMs > nowMs)
      .sort((a, b) => a.cutoffMs - b.cutoffMs);
    return future[0] || null;
  }, [racesForChampionship]);

  const nextRaceCountry = useMemo(() => {
    if (!nextRace?.title) return { flag: null, name: null };
    const code = getCountryCodeForRace(nextRace.title);
    if (!code) return { flag: null, name: null };
    const toFlagEmoji = (cc) => cc
      .toUpperCase()
      .replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt()));
    const flag = toFlagEmoji(code);
    let name = null;
    try {
      const regionNames = new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' });
      name = regionNames.of(code.toUpperCase());
    } catch (e) {
      name = code.toUpperCase();
    }
    return { flag, name };
  }, [nextRace?.title]);

  // Countdown to next race
  const [countdown, setCountdown] = useState(null);
  useEffect(() => {
    if (!nextRace?.date) { setCountdown(null); return; }
    // Countdown to 22:00 BRT (America/Sao_Paulo) on race date
    const base = new Date(nextRace.date);
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const day = base.getUTCDate();
    const targetDateUTC = new Date(Date.UTC(year, month, day, 22 + 3, 0, 0));
    const update = () => {
      const now = Date.now();
      const delta = Math.max(0, targetDateUTC.getTime() - now);
      const days = Math.floor(delta / (1000 * 60 * 60 * 24));
      const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${days}d ${hours}h ${minutes}m`);
    };
    update();
    const id = setInterval(update, 60000); // update every minute
    return () => clearInterval(id);
  }, [nextRace?.date]);

  const calendarHref = useMemo(() => {
    if (!nextRace?.date) return null;
    // Ensure start time is 22:00 America/Sao_Paulo (UTC-03:00, no DST at present)
    // Build a UTC instant corresponding to 22:00 BRT on the race date
    const base = new Date(nextRace.date);
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const day = base.getUTCDate();
    // 22:00 BRT == 01:00 UTC next day when offset is -03:00
    const startUTC = new Date(Date.UTC(year, month, day, 22 + 3, 0, 0));
    const endUTC = new Date(startUTC.getTime() + 2 * 60 * 60 * 1000); // 2h duration
    const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const text = encodeURIComponent(nextRace.title);
    const details = encodeURIComponent('LSF F1 race');
    const dates = `${fmt(startUTC)}/${fmt(endUTC)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
  }, [nextRace?.date, nextRace?.title]);

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

  // Handle championship registration
  const handleRegisterForChampionship = async (championshipId) => {
    if (!isLoggedIn) {
      return;
    }

    try {
      const response = await axiosInstance.post(`/api/championships/${championshipId}/register`);
      if (response.data.success) {
        // Show success message and refresh registration data
        console.log(response.data.message);
        
        // Refresh the queries to update the UI
        queryClient.invalidateQueries({ queryKey: ['registeringChampionships'] });
        queryClient.invalidateQueries({ queryKey: ['userRegistrationStatuses'] });
        
        // Find the championship data to check if there's a form link
        const championship = registeringChampionships.find(c => c.id === championshipId);
        if (championship && championship.registration_form_link) {
          setRegistrationSuccessData({
            championshipName: championship.name,
            formLink: championship.registration_form_link,
            isReserve: response.data.isReserve
          });
          setOpenRegistrationSuccessDialog(true);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error (could add a toast notification here)
    }
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

  const renderRegistrationCard = (championship) => {
    const registrationStatus = userRegistrationStatuses[championship.id];
    const isRegistered = registrationStatus?.isRegistered || false;
    const isReserve = registrationStatus?.isReserve || false;
    
    return (
      <Grid item xs={12} key={`registration-${championship.id}`}>
        <Card sx={{ 
          background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
          color: 'white',
          mb: 2
        }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              <Localized id="championship-registration-open-portuguese" />
            </Typography>
            <Typography variant="h6" component="h3" gutterBottom>
              {championship.name}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Box>
                <Typography variant="body1">
                  <Localized 
                    id="championship-registered-drivers" 
                    fallback="Registered Drivers"
                  />: {championship.registered_drivers}/20
                </Typography>
                {championship.registered_drivers >= 20 && (
                  <Typography variant="body2">
                    <Localized 
                      id="championship-reserve-drivers" 
                      fallback="Reserve Drivers"
                    />: {championship.reserve_drivers}
                  </Typography>
                )}
              </Box>
              {isLoggedIn && !isRegistered && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleRegisterForChampionship(championship.id)}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                >
                  <Localized id="championship-register-button" />
                </Button>
              )}
              {isLoggedIn && isRegistered && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                  <Box sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 1,
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2">
                      ✓ {isReserve ? (
                        <Localized id="championship-register-success-reserve" fallback="Registered as reserve" />
                      ) : (
                        <Localized id="championship-register-success" fallback="Successfully registered" />
                      )}
                    </Typography>
                  </Box>
                  {championship.registration_form_link && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => window.open(championship.registration_form_link, '_blank')}
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        }
                      }}
                    >
                      <Localized id="championship-fill-form-button" fallback="Fill Form" />
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero */}
      <Box sx={{
        mb: 4,
        p: 3,
        borderRadius: 2,
        background: 'linear-gradient(90deg, rgba(225,6,0,0.18) 0%, rgba(0,210,190,0.12) 100%)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {currentChampionship ? currentChampionship.name : <Skeleton width={220} />}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          <Localized id="dashboard-title" />
        </Typography>

        {/* Next Race mini panel */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalendarMonthIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              <Localized id="next-race-title" />
            </Typography>
            {isLoadingRaces ? (
              <Skeleton width={220} />
            ) : nextRace ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  {/* Country flag image like ClashesView + race name */}
                  {getCountryCodeForRace(nextRace.title) && (
                    <img 
                      src={`https://flagcdn.com/w20/${getCountryCodeForRace(nextRace.title)}.png`} 
                      width="20" 
                      height="15"
                      alt={nextRace.title}
                      style={{ verticalAlign: 'text-bottom', marginRight: 6 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  {nextRace.title} • <Localized id="race-date-label" />: {new Date(nextRace.date).toLocaleDateString()}
                </Typography>
                {countdown && (
                  <Typography variant="body2" color="text.secondary">
                    {countdown}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                <Localized id="next-race-not-scheduled" />
              </Typography>
            )}
          </Box>
          {nextRace && calendarHref && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<EventAvailableIcon />}
              onClick={() => window.open(calendarHref, '_blank')}
              sx={{ ml: 2 }}
            >
              <Localized id="add-to-calendar" />
            </Button>
          )}
        </Box>
      </Box>
      {/* Registration Cards - Show at top for all users */}
      {registeringChampionships.length > 0 && (
        <Box mb={4}>
          <Grid container spacing={2}>
            {registeringChampionships.map(renderRegistrationCard)}
          </Grid>
        </Box>
      )}

      {isLoggedIn && (
        <Box mb={4}>
          {isLoadingRunningChampionships && (
            <Box sx={{ my: 2 }}>
              <Skeleton variant="rounded" height={56} />
            </Box>
          )}
          {runningChampionshipsError && <Alert severity="error" sx={{my: 2}}><Localized id="fetch-championships-list-error" fallback="Failed to load championships list." /></Alert>}
          {!isLoadingRunningChampionships && !runningChampionshipsError && runningChampionshipsList.length > 0 && (
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
                {runningChampionshipsList.map((champ) => (
                  <MenuItem key={champ.id} value={champ.id}>
                    {champ.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {!isLoadingRunningChampionships && !runningChampionshipsError && runningChampionshipsList.length === 0 && isLoggedIn && (
             <Typography variant="subtitle1" color="text.secondary" sx={{textAlign: 'center', my: 2}}>
                <Localized id="no-participated-championships" />
            </Typography>
          )}

          {/* User Status Section */}
          {isLoadingUserStatus && (
            <Box sx={{ my: 2 }}>
              <Skeleton variant="rounded" height={140} />
            </Box>
          )}
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
          {!selectedChampionshipId && !isLoadingRunningChampionships && runningChampionshipsList.length > 0 && !isLoadingUserStatus && (
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

      {/* Registration Success Dialog with Form Link */}
      {registrationSuccessData && (
        <Dialog 
          open={openRegistrationSuccessDialog} 
          onClose={() => setOpenRegistrationSuccessDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            backgroundColor: 'success.main', 
            color: 'success.contrastText',
            textAlign: 'center'
          }}>
            <Typography variant="h5" component="h2">
              🎉 <Localized id="championship-registration-success-title" fallback="Registration Successful!" />
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {registrationSuccessData.championshipName}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {registrationSuccessData.isReserve ? (
                  <Localized id="championship-register-success-reserve" fallback="You've been registered as a reserve driver." />
                ) : (
                  <Localized id="championship-register-success" fallback="You've been successfully registered!" />
                )}
              </Typography>
            </Box>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                <Localized id="championship-form-urgent-title" fallback="URGENT: Complete Registration Form" />
              </Typography>
              <Typography variant="body2">
                <Localized id="championship-form-urgent-message" fallback="Please fill out the required registration form to complete your championship registration." />
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => {
                window.open(registrationSuccessData.formLink, '_blank');
                setOpenRegistrationSuccessDialog(false);
              }}
              sx={{ mr: 2 }}
            >
              <Localized id="championship-fill-form-now-button" fallback="Fill Form Now" />
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOpenRegistrationSuccessDialog(false)}
            >
              <Localized id="championship-fill-form-later-button" fallback="Fill Later" />
            </Button>
          </DialogActions>
        </Dialog>
      )}

    </Container>
  );
}

export default Home;