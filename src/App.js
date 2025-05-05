import React, { useState, useEffect, useMemo } from 'react';
import { LocalizationProvider, ReactLocalization, Localized } from '@fluent/react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Config from './components/Config';
import DriverRankings from './components/DriverRankings';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationBar from './components/NavigationBar';
import AdminRoute from './components/admin/AdminRoute';
import ChampionshipManager from './components/admin/ChampionshipManager';
import TeamManager from './components/admin/TeamManager';
import AdminPanel from './components/admin/AdminPanel';
import { bundles } from './i18n';

function App() {
  const [activeLocale, setActiveLocale] = useState('pt');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  const l10n = useMemo(() => {
    return new ReactLocalization(bundles.filter(bundle => bundle.locales.includes(activeLocale)));
  }, [activeLocale]);

  useEffect(() => {
    // WARNING: Storing auth status/roles in localStorage is insecure for production.
    // Always verify on the server-side for sensitive actions.
    localStorage.setItem('isLoggedIn', isLoggedIn);
    localStorage.setItem('isAdmin', isAdmin);
  }, [isLoggedIn, isAdmin]);

  // Effect to sync auth state from localStorage changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'isLoggedIn') {
        setIsLoggedIn(event.newValue === 'true');
      }
      if (event.key === 'isAdmin') {
        setIsAdmin(event.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const toggleLocale = () => {
    const newLocale = activeLocale === 'en' ? 'pt' : 'en';
    setActiveLocale(newLocale);
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
          <NavigationBar
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            handleLogout={handleLogout}
            toggleLocale={toggleLocale}
            activeLocale={activeLocale}
          />
          <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
              <Route path="/drivers" element={<DriverRankings isAdmin={isAdmin} />} />
            </Route>
            <Route element={<AdminRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin} />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/championships" element={<ChampionshipManager />} />
              <Route path="/admin/teams" element={<TeamManager />} />
              <Route path="/config" element={<Config />} />
            </Route>
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;