import React, { useState, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Localized } from '@fluent/react';
import { Container, Typography, TextField, Button, Box, Alert, CircularProgress, Paper, Avatar, Grid, Link } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import axiosInstance from '../utils/axiosInstance';
import RecoveryCodesDisplay from './RecoveryCodesDisplay';
import { useToast } from './ToastProvider';

// Simple debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};

function Register() {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usertag, setUsertag] = useState('');
  const [driverNumberInput, setDriverNumberInput] = useState('');
  const [isCheckingDriverNumber, setIsCheckingDriverNumber] = useState(false);
  const [driverNumberAvailable, setDriverNumberAvailable] = useState(null); // null, true, or false
  const [driverNumberError, setDriverNumberError] = useState(''); // Specific error for driver number field
  const [isLoading, setIsLoading] = useState(false); // General loading state for submission
  const [message, setMessage] = useState(''); // For general success/error messages
  const [success, setSuccess] = useState(false); // To determine Alert severity
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const navigate = useNavigate();

  // --- Driver Number Validation --- 
  const checkDriverNumberUniqueness = useCallback((number) => {
    const validateNumber = async () => {
      // Clear previous states before checking
      setDriverNumberError('');
      setDriverNumberAvailable(false);

      if (!number) {
        setIsCheckingDriverNumber(false);
        return;
      }

      setIsCheckingDriverNumber(true);
      try {
        const response = await axiosInstance.get(`/api/validate/driver-number/${number}`);
        if (!response.data.isAvailable) {
          setDriverNumberError('driver-number-invalid-or-taken');
          setDriverNumberAvailable(false);
        } else {
          setDriverNumberAvailable(true);
          setDriverNumberError('');
        }
      } catch (error) {
        console.error("Validation check failed:", error);
        setDriverNumberError('validation-check-failed');
        setDriverNumberAvailable(false);
      } finally {
        setIsCheckingDriverNumber(false);
      }
    };
    return debounce(validateNumber, 500)();
  }, []);

  const handleDriverNumberChange = (event) => {
    const value = event.target.value;
    setDriverNumberInput(value);
    if (value) {
      checkDriverNumberUniqueness(value);
    } else {
      // Clear status if input is empty
      setDriverNumberAvailable(null);
      setDriverNumberError('');
      setIsCheckingDriverNumber(false);
    }
  };

  const getDriverNumberHelperText = () => {
    if (isCheckingDriverNumber) return <Localized id="driver-number-checking" />;
    if (driverNumberError) return <Localized id={driverNumberError} />; 
    if (driverNumberAvailable === true) return <Localized id="driver-number-available" />;
    return ""; // Default no text
  };

  const getDriverNumberColor = () => {
     if (driverNumberError) return "error";
     if (driverNumberAvailable === true) return "success";
     return "primary"; // Default or while checking
  };

  // --- Form Submission --- 
  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage(''); // Clear previous messages
    setSuccess(false);

    // Basic client-side checks
    if (password !== confirmPassword) {
      setMessage('password-mismatch');
      return;
    }
    if (!username || !usertag || !driverNumberInput || !password) {
        setMessage('fill-all-fields'); // Add this key
        return;
    }
    if (isCheckingDriverNumber || driverNumberAvailable === null || !driverNumberAvailable) {
      setMessage('wait-driver-number-validation');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/register', {
        username,
        password,
        usertag,
        driverNumber: driverNumberInput,
      });

      if (response.data.success) {
        setMessage(response.data.message || 'register-success'); // Use success message from backend
        setSuccess(true);
        toast.show('success', <Localized id={response.data.message || 'register-success'} />);
        // Assuming the backend now returns recovery codes on successful registration
        if (response.data.recoveryCodes) {
            setRecoveryCodes(response.data.recoveryCodes);
        } else {
            // If no recovery codes are returned, redirect to login after a delay.
            setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        // Use error message from backend if available
        setMessage(response.data.message || 'registration-failed');
        toast.show('error', <Localized id={response.data.message || 'registration-failed'} />);
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Use error message from backend if available, otherwise generic
      const msg = error.response?.data?.message || 'registration-failed';
      setMessage(msg);
      toast.show('error', <Localized id={msg} />);
    } finally {
      setIsLoading(false);
    }
  };

  if (recoveryCodes.length > 0) {
    return <RecoveryCodesDisplay recoveryCodes={recoveryCodes} />;
  }

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
       <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                <PersonAddAlt1Icon />
            </Avatar>
            <Typography component="h1" variant="h5">
                <Localized id="register-title" />
            </Typography>
            <Box component="form" onSubmit={handleRegister} noValidate sx={{ mt: 3, width: '100%' }}>
                <Grid container spacing={2}>
                    {/* General Message Area */} 
                    {message && (
                        <Grid item xs={12}>
                            <Alert severity={success ? "success" : "error"} sx={{ width: '100%' }}>
                                <Localized id={message} fallback={message} />
                            </Alert>
                        </Grid>
                    )}

                    {/* Form Fields */} 
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            id="username"
                            label={<Localized id="username-label" />}
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                        />
                    </Grid>
                    <Grid item xs={12}>
                         <TextField
                            required
                            fullWidth
                            id="usertag"
                            label={<Localized id="usertag-label" />}
                            name="usertag"
                            autoComplete="nickname"
                            value={usertag}
                            onChange={(e) => setUsertag(e.target.value)}
                         />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            id="driverNumber"
                            label={<Localized id="driver-number-label" />}
                            name="driverNumber"
                            type="number" // Use number type
                            inputProps={{ min: 0 }} // Basic validation
                            value={driverNumberInput}
                            onChange={handleDriverNumberChange}
                            error={!!driverNumberError}
                            helperText={getDriverNumberHelperText()} // Use the helper function
                            color={getDriverNumberColor()} // Dynamic color
                            InputLabelProps={{ shrink: true }} // Keep label floated
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
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
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            name="confirmPassword"
                            label={<Localized id="confirm-password-label" />}
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!success && password !== confirmPassword && confirmPassword !== ''} // Show error if passwords don't match
                        />
                    </Grid>
                </Grid>
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={isLoading || isCheckingDriverNumber || driverNumberAvailable !== true} // Disable if loading, checking, or number not available
                >
                    {isLoading ? <CircularProgress size={24} /> : <Localized id="register-button" />}
                </Button>
                <Grid container justifyContent="flex-end">
                    <Grid item>
                         {/* Use MUI Link styled as RouterLink */}
                        <Link component={RouterLink} to="/login" variant="body2">
                             <Localized id="login-link" />
                        </Link>
                    </Grid>
                </Grid>
            </Box>
       </Paper>
    </Container>
  );
}

export default Register;
