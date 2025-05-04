import React from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function Home({ onLogout, isLoggedIn }) {
  const [showWelcomeMessage, setShowWelcomeMessage] = React.useState(false);

  React.useEffect(() => {
    const hasShownMessage = localStorage.getItem('hasShownWelcomeMessage');
    if (isLoggedIn && !hasShownMessage) {
      setShowWelcomeMessage(true);
      localStorage.setItem('hasShownWelcomeMessage', 'true');
    }
  }, [isLoggedIn]);

  return (
    <Container maxWidth="sm">
      <Typography variant="h1" component="h1" gutterBottom>
        <Localized id="welcome-message" />
      </Typography>
      <div className="content">
        {isLoggedIn ? (
          <>
            {showWelcomeMessage && (
              <Typography variant="body1">
                <Localized id="login-success" />
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body1">
            <Localized id="login-prompt" />
          </Typography>
        )}
      </div>
      <Button color="primary" component={Link} to="/drivers">
        <Localized id="view-driver-rankings" />
      </Button>
    </Container>
  );
}

export default Home;