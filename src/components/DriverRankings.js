import React, { useEffect, useState } from 'react';
import { Localized } from '@fluent/react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import FileUpload from './FileUpload';
import axios from 'axios';

function DriverRankings({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const [racesList, setRacesList] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadingRaces(true);
    setError(null);
    try {
      const driversResponse = await axios.get(`${apiUrl}/api/drivers`);
      setDrivers(driversResponse.data);
      
      const racesListResponse = await axios.get(`${apiUrl}/api/races/list`);
      setRacesList(racesListResponse.data);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching driver rankings or race list.');
    } finally {
      setIsLoading(false);
      setLoadingRaces(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRaceChange = (event) => {
    setSelectedRaceId(event.target.value);
  };

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
              <TableCell><Localized id="driver-team" /></TableCell>
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
              const teamName = driver.team_name || 'N/A';

              return (
                <TableRow key={driver.user_id || driver.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.driver_number}</TableCell>
                  <TableCell>{teamName}</TableCell>
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h2" component="h2" gutterBottom>
        <Localized id="driver-rankings-title" />
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {renderContent()}
        </Grid>
        {isAdmin && (
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
               <FormControl fullWidth disabled={loadingRaces}>
                 <InputLabel id="race-select-label"><Localized id="select-race-label"/></InputLabel>
                 <Select
                   labelId="race-select-label"
                   id="race-select"
                   value={selectedRaceId}
                   label={<Localized id="select-race-label"/>}
                   onChange={handleRaceChange}
                 >
                   <MenuItem value="">
                     <em><Localized id="select-race-placeholder"/></em>
                   </MenuItem>
                   {racesList.map((race) => (
                     <MenuItem key={race.id} value={race.id}>
                       {race.name}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Box>
            <FileUpload 
                onSuccess={fetchData}
                selectedRaceId={selectedRaceId}
                isAdmin={isAdmin}
            />
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default DriverRankings; 