import React, { useState, useEffect } from 'react';
import { LocalizationProvider, ReactLocalization, Localized } from '@fluent/react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Config from './components/Config';
import DriverRankings from './components/DriverRankings';
import { bundles } from './i18n';

function App() {
  const [activeLocale, setActiveLocale] = useState('pt');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  const [l10n, setL10n] = useState(new ReactLocalization(bundles.filter(bundle => bundle.locales.includes(activeLocale))));

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    localStorage.setItem('isAdmin', isAdmin);
  }, [isLoggedIn, isAdmin]);

  const toggleLocale = () => {
    const newLocale = activeLocale === 'en' ? 'pt' : 'en';
    setActiveLocale(newLocale);
    setL10n(new ReactLocalization(bundles.filter(bundle => bundle.locales.includes(newLocale))));
  };

  const handleLogin = (isAdmin) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdmin);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LocalizationProvider l10n={l10n}>
        <Router>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                <Localized id="app-title" />
              </Typography>
              <Button color="inherit" component={Link} to="/">
                <Localized id="home" />
              </Button>
              {isLoggedIn && isAdmin && (
                <Button color="inherit" component={Link} to="/config">
                  <Localized id="config" />
                </Button>
              )}
              {!isLoggedIn && (
                <Button color="inherit" component={Link} to="/login">
                  <Localized id="login" />
                </Button>
              )}
              {!isLoggedIn && (
                <Button color="inherit" component={Link} to="/register">
                  <Localized id="register" />
                </Button>
              )}
              {isLoggedIn && (
                <Button color="inherit" onClick={handleLogout}>
                  <Localized id="logout" />
                </Button>
              )}
              <Button color="inherit" onClick={toggleLocale}>
                {activeLocale === 'en' ? 'Português' : 'English'}
              </Button>
            </Toolbar>
          </AppBar>
          <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/config" element={<Config />} />
            <Route path="/drivers" element={<DriverRankings isAdmin={isAdmin} />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;