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
                <Localized id="home" />
              </MenuItem>
              {isLoggedIn && (
                <>
                  <MenuItem onClick={handleClose} component={Link} to="/drivers">
                    <Localized id="driver-rankings-title" />
                  </MenuItem>
                  <MenuItem onClick={handleClose} component={Link} to="/account">
                    <Localized id="account-link" />
                  </MenuItem>
                </>
              )}
              {isLoggedIn && isAdmin && (
                <MenuItem onClick={handleClose} component={Link} to="/admin">
                  <Localized id="admin-panel-link" />
                </MenuItem>
              )}
              {!isLoggedIn && (
                <>
                  <MenuItem onClick={handleClose} component={Link} to="/login">
                    <Localized id="login" />
                  </MenuItem>
                  <MenuItem onClick={handleClose} component={Link} to="/register">
                    <Localized id="register" />
                  </MenuItem>
                </>
              )}
              {isLoggedIn && (
                <MenuItem onClick={() => { handleClose(); handleLogout(); }}>
                  <Localized id="logout" />
                </MenuItem>
              )}
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