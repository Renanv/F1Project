import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Localized } from '@fluent/react';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';
import { handleRegister } from '../utils/authHandler';

const Register = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    handleRegister(e, username, password, confirmPassword, setMessage, navigate);
  };

  return (
    <Box sx={{ mt: 4, mx: 'auto', maxWidth: 400, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        <Localized id="register-title" />
      </Typography>
      <TextField
        label={<Localized id="username-label" />}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label={<Localized id="password-label" />}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label={<Localized id="confirm-password-label" />}
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
        fullWidth
      >
        <Localized id="register-button" />
      </Button>
      {message && (
        <Alert severity={message === 'register-success' ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Localized id={message} />
        </Alert>
      )}
    </Box>
  );
};

export default Register;
