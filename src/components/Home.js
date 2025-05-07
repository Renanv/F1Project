import React, { useState, useEffect } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Button, Grid, Card, CardContent, CardActionArea, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';

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
    <Container maxWidth="md" sx={{ mt: 4 }}>
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