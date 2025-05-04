import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Localized } from '@fluent/react';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password });
      if (response.data.success) {
        onLogin(response.data.isAdmin);
        navigate('/');
      }
    } catch (error) {
      setMessage('login-error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4, mx: 'auto', maxWidth: 400, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        <Localized id="login-title" />
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
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
        fullWidth
      >
        <Localized id="login-button" />
      </Button>
      {message && (
        <Alert severity={message === 'login-success' ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Localized id={message} />
        </Alert>
      )}
    </Box>
  );
};

export default Login;