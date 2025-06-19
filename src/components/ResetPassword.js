import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Localized } from '@fluent/react';
import { Container, Typography, TextField, Button, Box, Alert, CircularProgress, Paper, Avatar } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import axiosInstance from '../utils/axiosInstance';

function ResetPassword() {
  const [step, setStep] = useState(1); // 1: enter username/code, 2: reset password
  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      await axiosInstance.post('/api/auth/verify-recovery-code', { username, recoveryCode });
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data?.message || 'verify-code-failed');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage('password-mismatch');
      setIsError(true);
      return;
    }
    setIsLoading(true);
    setMessage('');
    setIsError(false);
    try {
      await axiosInstance.post('/api/auth/reset-password', { username, recoveryCode, newPassword: password });
      setMessage('password-reset-success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'password-reset-failed');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockResetIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          <Localized id="reset-password-title" />
        </Typography>
        <Box component="form" onSubmit={step === 1 ? handleVerifyCode : handleResetPassword} noValidate sx={{ mt: 3, width: '100%' }}>
          {message && (
            <Alert severity={isError ? 'error' : 'success'} sx={{ width: '100%', mb: 2 }}>
              <Localized id={message} fallback={message} />
            </Alert>
          )}

          {step === 1 && (
            <>
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
                id="recoveryCode"
                label={<Localized id="recovery-code-label" />}
                name="recoveryCode"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : <Localized id="verify-code-button" />}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={<Localized id="new-password-label" />}
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
                label={<Localized id="confirm-new-password-label" />}
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : <Localized id="reset-password-button" />}
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default ResetPassword; 