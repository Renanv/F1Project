import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Localized } from '@fluent/react';
import { Container, Typography, Button, Box, Alert, Paper, Avatar } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

function RecoveryCodesDisplay({ recoveryCodes, showLoginButton = true }) {
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCodes.join(', '));
    // Maybe show a small notification that codes have been copied.
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
          <PersonAddAlt1Icon />
        </Avatar>
        <Typography component="h1" variant="h5">
          <Localized id="register-success-title" />
        </Typography>
        <Alert severity="warning" sx={{ mt: 2, mb: 2, width: '100%' }}>
          <Localized id="recovery-codes-warning" />
        </Alert>
        <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: 1, width: '100%', fontFamily: 'monospace', wordWrap: 'break-word' }}>
          {recoveryCodes.join(', ')}
        </Box>
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={handleCopy}
        >
          <Localized id="copy-codes-button" />
        </Button>
        {showLoginButton && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1, mb: 2 }}
            onClick={() => navigate('/login')}
          >
            <Localized id="proceed-to-login-button" />
          </Button>
        )}
      </Paper>
    </Container>
  );
}

export default RecoveryCodesDisplay; 