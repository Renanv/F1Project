import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LocalizationProvider, ReactLocalization } from '@fluent/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from './utils/axiosInstance';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Config from './components/Config';
import DriverRankings from './components/DriverRankings';
import AccountPage from './components/AccountPage';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationBar from './components/NavigationBar';
import AdminRoute from './components/admin/AdminRoute';
import ChampionshipManager from './components/admin/ChampionshipManager';
import TeamManager from './components/admin/TeamManager';
import AdminPanel from './components/admin/AdminPanel';
import { bundles } from './i18n';

function App() {
  const [activeLocale, setActiveLocale] = useState('pt');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const l10n = useMemo(() => {
    return new ReactLocalization(bundles.filter(bundle => bundle.locales.includes(activeLocale)));
  }, [activeLocale]);

  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem('authToken');
    setIsLoadingAuth(true);
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          console.log("Token expired");
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
          setIsAdmin(false);
        } else {
          setIsLoggedIn(true);
          setIsAdmin(!!decodedToken.isAdmin);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'authToken') {
        checkAuthStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);

  const toggleLocale = () => {
    const newLocale = activeLocale === 'en' ? 'pt' : 'en';
    setActiveLocale(newLocale);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  // Callback for Login component
  const handleLoginSuccess = () => {
    console.log('Login success callback triggered. Re-checking auth status...');
    checkAuthStatus(); // Immediately update state after token is set
  };

  if (isLoadingAuth) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Authentication...</div>;
  }

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
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} isAdmin={isAdmin} />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
              <Route path="/drivers" element={<DriverRankings isAdmin={isAdmin} />} />
              <Route path="/account" element={<AccountPage />} />
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