import React from 'react';
import { Link } from 'react-router-dom';
import { Localized } from '@fluent/react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import RefreshIcon from '@mui/icons-material/Refresh';
import GavelIcon from '@mui/icons-material/Gavel';

// Import additional icons for mobile menu
import HomeIcon from '@mui/icons-material/Home';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import LogoutIcon from '@mui/icons-material/Logout';

// Import SVG flags as React components
import { ReactComponent as BrazilFlagIcon } from '../assets/brazil_flag.svg';
import { ReactComponent as USFlagIcon } from '../assets/us_flag.svg';

// Props expected: isLoggedIn, isAdmin, handleLogout, toggleLocale, activeLocale
const NavigationBar = ({ isLoggedIn, isAdmin, handleLogout, toggleLocale, activeLocale }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const clearCacheAndReload = () => {
    console.log('Attempting to clear cache and reload...');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        if (registrations.length > 0) {
          console.log(`Found ${registrations.length} service worker registrations.`);
          let unregisterPromises = registrations.map(function(registration) {
            return registration.unregister().then(function(success) {
              console.log(`Service worker ${registration.scope} unregister: ${success}`);
              return success;
            });
          });
          Promise.all(unregisterPromises).then(() => {
            console.log('All service workers unregistered (or attempted to).');
            // Force reload from server by adding a cache-busting query parameter
            window.location.href = window.location.pathname + '?v=' + new Date().getTime();
          });
        } else {
          console.log('No service workers found to unregister.');
          window.location.href = window.location.pathname + '?v=' + new Date().getTime();
        }
      }).catch(function(error) {
        console.error('Service Worker unregistration failed:', error);
        window.location.href = window.location.pathname + '?v=' + new Date().getTime();
      });
    } else {
      console.log('Service workers not supported or not active. Reloading page.');
      window.location.href = window.location.pathname + '?v=' + new Date().getTime();
    }
    handleClose(); // Close the menu if open
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <SportsScoreIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {/* Removed Localized app-title */}
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 1 }} // Adjusted margin for mobile
              onClick={handleMenu}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={menuOpen}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose} component={Link} to="/">
                <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="home" />
              </MenuItem>
              {isLoggedIn && (
                <>
                  <MenuItem onClick={handleClose} component={Link} to="/drivers">
                    <LeaderboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="driver-rankings-title" />
                  </MenuItem>
                  <MenuItem onClick={handleClose} component={Link} to="/penalties">
                    <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="penalties-list-link" />
                  </MenuItem>
                  <MenuItem onClick={handleClose} component={Link} to="/account">
                    <AccountCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="account-link" />
                  </MenuItem>
                </>
              )}
              {isLoggedIn && isAdmin && (
                <MenuItem onClick={handleClose} component={Link} to="/admin">
                  <AdminPanelSettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="admin-panel-link" />
                </MenuItem>
              )}
              {!isLoggedIn && (
                <>
                  <MenuItem onClick={handleClose} component={Link} to="/login">
                    <LoginIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="login" />
                  </MenuItem>
                  <MenuItem onClick={handleClose} component={Link} to="/register">
                    <AppRegistrationIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="register" />
                  </MenuItem>
                </>
              )}
              {isLoggedIn && (
                <MenuItem onClick={() => { handleClose(); handleLogout(); }}>
                  <LogoutIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="logout" />
                </MenuItem>
              )}
              <MenuItem onClick={clearCacheAndReload}>
                <RefreshIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" /> <Localized id="clear-cache-reload" />
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/">
              <Localized id="home" />
            </Button>
            {isLoggedIn && (
               <>
                 <Button color="inherit" component={Link} to="/drivers">
                   <Localized id="driver-rankings-title" />
                 </Button>
                 <Button color="inherit" component={Link} to="/penalties">
                   <Localized id="penalties-list-link" />
                 </Button>
                 <Button color="inherit" component={Link} to="/account">
                   <Localized id="account-link" />
                 </Button>
               </>
            )}
            {isLoggedIn && isAdmin && (
              <>
                <Button color="inherit" component={Link} to="/admin">
                  <Localized id="admin-panel-link" />
                </Button>
              </>
            )}
            {!isLoggedIn && (
              <>
                <Button color="inherit" component={Link} to="/login">
                  <Localized id="login" />
                </Button>
                <Button color="inherit" component={Link} to="/register">
                  <Localized id="register" />
                </Button>
              </>
            )}
            {isLoggedIn && (
              <Button color="inherit" onClick={handleLogout}>
                <Localized id="logout" />
              </Button>
            )}
            <Button color="inherit" onClick={clearCacheAndReload} title="Clear Cache & Reload">
              <RefreshIcon sx={{ mr: 0.5 }} />
            </Button>
          </>
        )}

        {/* Language toggle button remains outside the hamburger menu */}
        <Button color="inherit" onClick={toggleLocale} sx={{ ml: isMobile ? 'auto' : 1 }}>
          {isMobile ? (
            activeLocale === 'en' ? <BrazilFlagIcon width="24" height="24" /> : <USFlagIcon width="24" height="24" />
          ) : activeLocale === 'en' ? (
            <Localized id="toggle-locale-pt"><span /></Localized>
          ) : (
            <Localized id="toggle-locale-en"><span /></Localized>
          )}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar; 