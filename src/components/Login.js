import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Localized } from '@fluent/react';
import { Container, Typography, TextField, Button, Box, Alert, CircularProgress, Paper, Avatar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import axiosInstance from '../utils/axiosInstance';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/api/login', { username, password });
      localStorage.setItem('authToken', response.data.token);
      console.log('Token stored, calling onLoginSuccess');
      onLoginSuccess(); // Call the callback passed from App
      navigate('/'); // Redirect to home
    } catch (err) {
      console.error('Login error:', err);
      // Use error message from response or a generic one
      const errorKey = err.response?.data?.message || 'login-failed-generic'; 
      setError(errorKey); 
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
                 {/* Link to Register can be added back if needed and key exists */}
            </Box>
        </Paper>
    </Container>
  );
}

export default Login;