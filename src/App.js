import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LocalizationProvider, ReactLocalization, Localized } from '@fluent/react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/Home';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { jwtDecode } from 'jwt-decode';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axiosInstance from './utils/axiosInstance';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import Config from './components/Config';
import DriverRankings from './components/RankingsPage';
import AccountPage from './components/AccountPage';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationBar from './components/NavigationBar';
import AdminRoute from './components/admin/AdminRoute';
import ChampionshipManager from './components/admin/ChampionshipManager';
import TeamManager from './components/admin/TeamManager';
import AdminPanel from './components/admin/AdminPanel';
import AdminUploadedFilesPage from './components/admin/AdminUploadedFilesPage';
import AwardsPage from './components/admin/AwardsPage';
import { bundles } from './i18n';
import ToastProvider from './components/ToastProvider';

// Penalty System Components
import PenaltySubmissionForm from './components/penalties/PenaltySubmissionForm';
import PenaltiesListPage from './components/penalties/PenaltiesListPage';
import PenaltyDetailPage from './components/penalties/PenaltyDetailPage';
import MyJuryTasksPage from './components/penalties/MyJuryTasksPage';
import AdminPenaltyManager from './components/admin/AdminPenaltyManager';
import CommunityPage from './components/CommunityPage'; // Import the new page

// Create a client
const queryClient = new QueryClient();

function App() {
  const [activeLocale, setActiveLocale] = useState('pt');
  const [density] = useState('compact');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [updateSnackbar, setUpdateSnackbar] = useState({ open: false, registration: null });

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

  // Listen for SW update events and show snackbar
  useEffect(() => {
    const handler = (e) => {
      setUpdateSnackbar({ open: true, registration: e.detail.registration });
    };
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  const handleApplyUpdate = () => {
    const reg = updateSnackbar.registration;
    if (reg && reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
    }
  };

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
    navigate('/login');
  };

  const darkTheme = responsiveFontSizes(createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#E10600' }, // Ferrari red accent
      secondary: { main: '#00D2BE' }, // Mercedes teal accent
      background: {
        default: '#0B0D10',
        paper: '#14181F'
      },
      text: {
        primary: '#E6E8EB',
        secondary: '#A9B1BA'
      },
      success: { main: '#2ECC71' },
      warning: { main: '#F39C12' },
      error:   { main: '#FF4D4F' },
      info:    { main: '#3498DB' }
    },
    shape: {
      borderRadius: 12
    },
    typography: {
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
      h1: { fontWeight: 700, letterSpacing: 0.3 },
      h2: { fontWeight: 700, letterSpacing: 0.2 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: 'radial-gradient(1200px 800px at 100% -10%, rgba(225,6,0,0.12), transparent 60%), radial-gradient(1000px 600px at -20% 120%, rgba(0,210,190,0.10), transparent 60%)',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          },
          '@media (max-width:600px)': {
            body: {
              // Simpler, uniform gradient for mobile
              backgroundImage: 'linear-gradient(180deg, rgba(225,6,0,0.10) 0%, rgba(0,210,190,0.10) 100%)',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              backgroundSize: 'cover'
            }
          }
        }
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: density === 'compact'
        }
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            paddingTop: density === 'compact' ? 4 : undefined,
            paddingBottom: density === 'compact' ? 4 : undefined
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          size: density === 'compact' ? 'small' : 'medium'
        }
      },
      MuiFormControl: {
        defaultProps: {
          margin: density === 'compact' ? 'dense' : 'normal'
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: density === 'compact' ? '8px 12px' : undefined
          }
        }
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            minWidth: density === 'compact' ? 28 : undefined,
            height: density === 'compact' ? 28 : undefined
          }
        }
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, padding: density === 'compact' ? '6px 10px' : undefined }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#0F1115',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }
        }
      },
      MuiCard: {
        defaultProps: { elevation: 2 },
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 12 }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255,255,255,0.02)'
          }
        }
      }
    }
  }));

  // Callback for Login component
  const handleLoginSuccess = () => {
    console.log('Login success callback triggered. Re-checking auth status...');
    checkAuthStatus();
    navigate('/');
  };

  if (isLoadingAuth) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Authentication...</div>;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LocalizationProvider l10n={l10n}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
              <Route path="/drivers" element={<DriverRankings isAdmin={isAdmin} />} />
              <Route path="/account" element={<AccountPage />} />
              {/* Penalty System Routes for authenticated users */}
              <Route path="/penalties" element={<PenaltiesListPage />} />
              <Route path="/penalties/submit" element={<PenaltySubmissionForm />} />
              <Route path="/penalties/:penaltyId" element={<PenaltyDetailPage />} />
              <Route path="/jury/tasks" element={<MyJuryTasksPage />} />
              <Route path="/community" element={<CommunityPage isAdmin={isAdmin} />} />
            </Route>
            <Route element={<AdminRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin} />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/championships" element={<ChampionshipManager />} />
              <Route path="/admin/teams" element={<TeamManager />} />
              <Route path="/config" element={<Config />} />
              {/* Admin Penalty Management Route */}
              <Route path="/admin/penalties" element={<AdminPenaltyManager />} />
              {/* Admin Uploaded Files Overview Route */}
              <Route path="/admin/uploaded-files" element={<AdminUploadedFilesPage />} />
              {/* Admin Awards Page Route */}
              <Route path="/admin/awards" element={<AwardsPage />} />
            </Route>
          </Routes>

          {/* Bottom Navigation - Mobile only */}
          {isMobile && (
            <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {(() => {
                const actions = isLoggedIn
                  ? [
                      { id: 'home', icon: <HomeIcon />, to: '/' },
                      { id: 'rankings-page-title', icon: <LeaderboardIcon />, to: '/drivers' },
                      { id: 'penalties-page-title', icon: <GavelIcon />, to: '/penalties' },
                      { id: 'account-link', icon: <AccountCircleIcon />, to: '/account' }
                    ]
                  : [
                      { id: 'login', icon: <LoginIcon />, to: '/login' },
                      { id: 'register', icon: <AppRegistrationIcon />, to: '/register' }
                    ];

                // Clamp selected index within available range
                const value = Math.min(bottomNavValue, actions.length - 1);

                return (
                  <BottomNavigation
                    value={value}
                    onChange={(e, newValue) => {
                      setBottomNavValue(newValue);
                      const target = actions[newValue];
                      if (target) navigate(target.to);
                    }}
                    showLabels
                  >
                    {actions.map((a, idx) => (
                      <BottomNavigationAction key={idx} label={<Localized id={a.id}><span /></Localized>} icon={a.icon} />
                    ))}
                  </BottomNavigation>
                );
              })()}
            </Paper>
          )}

          {/* Update Available Snackbar */}
          <Snackbar
            open={updateSnackbar.open}
            onClose={() => setUpdateSnackbar({ open: false, registration: null })}
            autoHideDuration={8000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              severity="info"
              variant="filled"
              onClose={() => setUpdateSnackbar({ open: false, registration: null })}
              action={
                <Button color="inherit" size="small" onClick={handleApplyUpdate}>
                  <Localized id="pwa-refresh-now"><span /></Localized>
                </Button>
              }
            >
              <Localized id="pwa-update-available" fallback="A new version is available. Refresh to update." />
            </Alert>
          </Snackbar>
          </ToastProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

function Root() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default Root;