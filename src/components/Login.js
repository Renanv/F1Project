import React, { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, CircularProgress, Paper, Grid, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Localized } from '@fluent/react';
import { Avatar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import axiosInstance from '../utils/axiosInstance';
import { useToast } from './ToastProvider';

function Login({ onLoginSuccess }) {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/api/auth/login', { username, password });
      localStorage.setItem('authToken', response.data.token);
      console.log('Token stored, calling onLoginSuccess');
      toast.show('success', <Localized id="login-success" />);
      onLoginSuccess(); // Call the callback passed from App
    } catch (err) {
      console.error('Login error:', err);
      // Use error message from response or a generic one
      const errorKey = err.response?.data?.message || 'login-failed-generic'; 
      setError(errorKey);
      toast.show('error', <Localized id={errorKey} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
                <Localized id="login-title" />
            </Typography>
            <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 3, width: '100%' }}> {/* Use mt: 3 */} 
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}><Localized id={error} fallback="Login failed. Please check credentials." /></Alert>}
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label={<Localized id="username-label" />}
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label={<Localized id="password-label" />}
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={isLoading}
                >
                    {isLoading ? <CircularProgress size={24} /> : <Localized id="login-button" />}
                </Button>
                <Grid container justifyContent="flex-end">
                    <Grid item>
                        <Link component={RouterLink} to="/register" variant="body2">
                            <Localized id="register-link" />
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link component={RouterLink} to="/reset-password" variant="body2" sx={{ ml: 2 }}>
                             <Localized id="forgot-password-link" />
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    </Container>
  );
}

export default Login;