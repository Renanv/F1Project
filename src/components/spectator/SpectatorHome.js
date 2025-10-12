import React from 'react';
import { Container, Grid, Card, CardActionArea, CardContent, Typography, Box, Button, Skeleton, IconButton } from '@mui/material';
import { Localized } from '@fluent/react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LogoutIcon from '@mui/icons-material/Logout';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance';
import { getCountryCodeForRace } from '../../utils/raceToCountryCode';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function SpectatorHome({ handleLogout }) {
  const navigate = useNavigate();
  const [selectedChampionshipId, setSelectedChampionshipId] = React.useState(() => localStorage.getItem('spectator:championshipId') || '');

  const { data: runningChampionships = [] } = useQuery({
    queryKey: ['spectator:runningChampionships'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/championships?forHomepage=true');
      return res.data;
    }
  });

  React.useEffect(() => {
    if (runningChampionships && runningChampionships.length > 0) {
      if (!selectedChampionshipId || !runningChampionships.find(c => c.id === selectedChampionshipId)) {
        setSelectedChampionshipId(runningChampionships[0].id);
      }
    }
  }, [runningChampionships, selectedChampionshipId]);

  const { data: racesForChampionship = [], isLoading: isLoadingRaces } = useQuery({
    queryKey: ['spectator:homeRaces', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const res = await axiosInstance.get(`/api/championships/${selectedChampionshipId}/races`);
      return res.data || [];
    },
    enabled: !!selectedChampionshipId
  });

  const nextRace = React.useMemo(() => {
    if (!racesForChampionship || racesForChampionship.length === 0) return null;
    const nowMs = Date.now();
    const toCutoff = (dateStr) => {
      const base = new Date(dateStr);
      return Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 22 + 3, 0, 0);
    };
    const future = racesForChampionship
      .map((r) => ({ ...r, cutoffMs: r.date ? toCutoff(r.date) : null }))
      .filter((r) => r.cutoffMs && r.cutoffMs > nowMs)
      .sort((a, b) => a.cutoffMs - b.cutoffMs);
    return future[0] || null;
  }, [racesForChampionship]);

  const [countdown, setCountdown] = React.useState(null);
  React.useEffect(() => {
    if (!nextRace?.date) { setCountdown(null); return; }
    const base = new Date(nextRace.date);
    const targetDateUTC = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 22 + 3, 0, 0));
    const update = () => {
      const now = Date.now();
      const delta = Math.max(0, targetDateUTC.getTime() - now);
      const days = Math.floor(delta / (1000 * 60 * 60 * 24));
      const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${days}d ${hours}h ${minutes}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [nextRace?.date]);

  const calendarHref = React.useMemo(() => {
    if (!nextRace?.date) return null;
    const base = new Date(nextRace.date);
    const startUTC = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 22 + 3, 0, 0));
    const endUTC = new Date(startUTC.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const text = encodeURIComponent(nextRace.title);
    const details = encodeURIComponent('LSF F1 race');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(startUTC)}/${fmt(endUTC)}&details=${details}`;
  }, [nextRace?.date, nextRace?.title]);

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 2, px: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}><Localized id="home" /></Typography>
          <Typography variant="body1" color="text.secondary"><Localized id="dashboard-title" /></Typography>
        </Box>
        <IconButton 
          onClick={handleLogout} 
          color="primary" 
          sx={{ 
            border: '1px solid',
            borderColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.main', color: 'white' }
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Box>

      {/* Next Race panel (no user status block) */}
      <Box sx={{
        mb: 4,
        p: 3,
        borderRadius: 2,
        background: 'linear-gradient(90deg, rgba(225,6,0,0.18) 0%, rgba(0,210,190,0.12) 100%)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Box sx={{ mt: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                  <Typography variant="body2" color="text.secondary">{countdown}</Typography>
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={3}>
          <Card>
            <CardActionArea component={RouterLink} to="/spectator/rankings">
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <LeaderboardIcon fontSize="large" />
                <Typography variant="h6" sx={{ mt: 1 }}><Localized id="rankings-page-title" fallback="Rankings" /></Typography>
                <Typography variant="body2" color="text.secondary"><Localized id="view-driver-rankings" /></Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} md={4} lg={3}>
          <Card>
            <CardActionArea component={RouterLink} to="/spectator/community">
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <VideoLibraryIcon fontSize="large" />
                <Typography variant="h6" sx={{ mt: 1 }}><Localized id="community-page-title" fallback="Community" /></Typography>
                <Typography variant="body2" color="text.secondary"><Localized id="community-page-description" /></Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SpectatorHome;


