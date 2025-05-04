import React, { useEffect, useState } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid } from '@mui/material';
import FileUpload from './FileUpload';

function DriverRankings({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);

  const fetchDrivers = () => {
    fetch('http://localhost:5000/api/drivers')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setDrivers(data))
      .catch(error => console.error('Error fetching drivers:', error));
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" component="h2" gutterBottom>
        <Localized id="driver-rankings-title" />
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Localized id="driver-position" /></TableCell>
                  <TableCell><Localized id="driver-name" /></TableCell>
                  <TableCell><Localized id="driver-number" /></TableCell>
                  <TableCell><Localized id="driver-table-points" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((driver, index) => (
                  <TableRow key={driver.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell>{driver.driver_number}</TableCell>
                    <TableCell>
                      <Localized id="driver-points" vars={{ points: driver.points }}>
                        <span>{'{$points}'}</span>
                      </Localized>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={4}>
          {isAdmin && <FileUpload onSuccess={fetchDrivers} />}
        </Grid>
      </Grid>
    </Container>
  );
}

export default DriverRankings; 