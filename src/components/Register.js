import React, { useState, useCallback } from 'react';
import { Localized } from '@fluent/react';
import { Container, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

// Simple debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usertag, setUsertag] = useState('');
  const [driverNumber, setDriverNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [driverNumberError, setDriverNumberError] = useState('');
  const [isCheckingDriverNumber, setIsCheckingDriverNumber] = useState(false);
  const [driverNumberAvailable, setDriverNumberAvailable] = useState(false);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  // Debounced function to check driver number uniqueness
  const checkDriverNumberUniqueness = useCallback(debounce(async (number) => {
    setDriverNumberAvailable(false);
    if (!number) {
      setDriverNumberError('');
      setIsCheckingDriverNumber(false);
      return;
    }
    setIsCheckingDriverNumber(true);
    setDriverNumberError('');
    try {
      const response = await fetch(`${apiUrl}/api/validate/driver-number/${number}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.isAvailable) {
        setDriverNumberError('driver-number-taken-error');
      } else {
        setDriverNumberAvailable(true);
      }
    } catch (error) {
      console.error("Validation check failed:", error);
      setDriverNumberAvailable(false);
    } finally {
      setIsCheckingDriverNumber(false);
    }
  }, 500), [apiUrl]);

  const handleDriverNumberChange = (event) => {
    const value = event.target.value;
    setDriverNumberAvailable(false);
    if (/^\d*$/.test(value)) {
      setDriverNumber(value);
      checkDriverNumberUniqueness(value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('password-mismatch');
      return;
    }
    if (driverNumberError || !driverNumber) {
        setError(driverNumberError || 'driver-number-required');
        return;
    }
     if (!usertag) {
        setError('usertag-required');
        return;
    }
    if (isCheckingDriverNumber) {
        setError('wait-driver-number-validation');
        return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, usertag, driverNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'register-failure');
      }
      setSuccess('register-success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'register-error');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          <Localized id="register-title" />
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
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
            id="usertag"
            label={<Localized id="usertag-label" />}
            name="usertag"
            autoComplete="off"
            value={usertag}
            onChange={(e) => setUsertag(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="driverNumber"
            label={<Localized id="driver-number-label" />}
            name="driverNumber"
            type="text"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            value={driverNumber}
            onChange={handleDriverNumberChange}
            error={!!driverNumberError || (error === 'driver-number-required' && !driverNumber)}
            helperText={
                isCheckingDriverNumber ? <Localized id="driver-number-checking" /> :
                driverNumberError ? <Localized id={driverNumberError} /> :
                (error === 'driver-number-required' && !driverNumber) ? <Localized id='driver-number-required' /> :
                driverNumberAvailable && !!driverNumber ? <Localized id='driver-number-available' /> :
                ''
            }
            sx={{
              ...(driverNumberAvailable && !driverNumberError && !isCheckingDriverNumber && !!driverNumber && {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'success.main' },
                  '&:hover fieldset': { borderColor: 'success.dark' },
                  '&.Mui-focused fieldset': { borderColor: 'success.main' },
                },
              }),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={<Localized id="password-label" />}
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label={<Localized id="confirm-password-label" />}
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={error === 'password-mismatch'}
            helperText={error === 'password-mismatch' ? <Localized id={error} /> : ''}
          />
          {error && !driverNumberError && error !== 'password-mismatch' && error !== 'driver-number-required' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Localized id={error} />
            </Alert>
          )}
          {error === 'password-mismatch' && (
             <Alert severity="error" sx={{ mt: 2 }}>
               <Localized id={error} />
             </Alert>
           )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Localized id={success} />
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isCheckingDriverNumber}
          >
            <Localized id="register-button" />
          </Button>
          <Link to="/login" variant="body2">
            <Localized id="login-link" />
          </Link>
        </Box>
      </Box>
    </Container>
  );
}

export default Register;
