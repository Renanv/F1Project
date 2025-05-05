import React, { useEffect, useState } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import FileUpload from './FileUpload';

function DriverRankings({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const fetchDrivers = () => {
    setIsLoading(true);
    setError(null);
    fetch(`${apiUrl}/api/drivers`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setDrivers(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching drivers:', error);
        setError(error.message);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <CircularProgress />;
    }
    if (error) {
      return <Alert severity="error"><Localized id="fetch-drivers-error" vars={{ message: error }}><span>Error: {error}</span></Localized></Alert>;
    }
    if (drivers.length === 0) {
      return <Typography><Localized id="no-drivers-found" /></Typography>;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Localized id="driver-position" /></TableCell>
              <TableCell><Localized id="driver-name" /></TableCell>
              <TableCell><Localized id="driver-number" /></TableCell>
              <TableCell><Localized id="driver-table-score" /></TableCell>
              <TableCell><Localized id="driver-table-points" /></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((driver, index) => {
              const formattedScore = typeof driver.score === 'number' 
                  ? driver.score.toFixed(2) 
                  : (typeof driver.score === 'string' ? parseFloat(driver.score).toFixed(2) : '0.00');
              
              const actualPoints = driver.points !== null && driver.points !== undefined ? driver.points : 0;

              return (
                <TableRow key={driver.user_id || driver.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.driver_number}</TableCell>
                  <TableCell>
                    <Localized id="driver-score-value" vars={{ score: formattedScore }}>
                      <span>{formattedScore} pts</span>
                    </Localized>
                  </TableCell>
                  <TableCell>{actualPoints}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" component="h2" gutterBottom>
        <Localized id="driver-rankings-title" />
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {renderContent()}
        </Grid>
        <Grid item xs={12} md={4}>
          {isAdmin && <FileUpload onSuccess={fetchDrivers} />}
        </Grid>
      </Grid>
    </Container>
  );
}

export default DriverRankings; 