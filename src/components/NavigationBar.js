import React from 'react';
import { Link } from 'react-router-dom';
import { Localized } from '@fluent/react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// Props expected: isLoggedIn, isAdmin, handleLogout, toggleLocale, activeLocale
const NavigationBar = ({ isLoggedIn, isAdmin, handleLogout, toggleLocale, activeLocale }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Localized id="app-title" />
        </Typography>
        <Button color="inherit" component={Link} to="/">
          <Localized id="home" />
        </Button>
        {isLoggedIn && (
           <Button color="inherit" component={Link} to="/drivers">
             <Localized id="driver-rankings-title" />
           </Button>
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
        <Button color="inherit" onClick={toggleLocale}>
          {activeLocale === 'en'
            ? <Localized id="toggle-locale-pt"><span/></Localized>
            : <Localized id="toggle-locale-en"><span/></Localized>}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar; 