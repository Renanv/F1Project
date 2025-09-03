import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Box, Alert, CircularProgress, Grid, Paper, TextField, Avatar, Slider, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { Localized } from '@fluent/react';
import axiosInstance from '../utils/axiosInstance';
import SettingsIcon from '@mui/icons-material/Settings';

const Config = () => {
  const [teamConfigs, setTeamConfigs] = useState([]);
  const [racePoints, setRacePoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      try {
        const [teamRes, pointsRes] = await Promise.all([
          axiosInstance.get('/api/team-configs'),
          axiosInstance.get('/api/race-points-config')
        ]);
        setTeamConfigs(teamRes.data);
        setRacePoints(pointsRes.data);
      } catch (err) {
        console.error('Error fetching configurations:', err);
        setError('fetch-config-error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleTeamConfigChange = (teamName, newValue) => {
    const value = parseFloat(newValue.toFixed(2));
    setTeamConfigs(currentConfigs =>
      currentConfigs.map(config =>
        config.team_name === teamName ? { ...config, config_value: value } : config
      )
    );
  };

  const handleRacePointChange = (id, value) => {
    const newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0) {
        console.warn("Invalid number entered for race points");
        return;
    }
    setRacePoints(currentPoints =>
      currentPoints.map(point =>
        point.id === id ? { ...point, points: newValue } : point
      )
    );
  };

  const handleSave = async () => {
    console.log('[Config.js] handleSave: Initiating save...');
    setIsSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      console.log(`[Config.js] handleSave: Preparing to update ${teamConfigs.length} team configs and ${racePoints.length} race points.`);

      const teamUpdatePromises = teamConfigs.map(config => {
        console.log(`[Config.js] handleSave: Creating promise to update team config ID ${config.id} with value ${config.config_value}`);
        return axiosInstance.put(`/api/team-configs/${config.id}`, {
          configValue: config.config_value
        }).then(response => ({ status: 'fulfilled', id: config.id, response }))
          .catch(error => ({ status: 'rejected', id: config.id, error }));
      });

      const pointsUpdatePromises = racePoints.map(point => {
        console.log(`[Config.js] handleSave: Creating promise to update race point ID ${point.id} with points ${point.points}`);
        return axiosInstance.put(`/api/race-points-config/${point.id}`, {
          points: point.points
        }).then(response => ({ status: 'fulfilled', id: point.id, response }))
          .catch(error => ({ status: 'rejected', id: point.id, error }));
      });

      console.log('[Config.js] handleSave: Awaiting all promises...');
      const results = await Promise.all([...teamUpdatePromises, ...pointsUpdatePromises]); // Using all instead of allSettled for simpler individual logging
      console.log('[Config.js] handleSave: All promises settled. Results:', results);

      const failedUpdates = results.filter(result => result.status === 'rejected');
      if (failedUpdates.length > 0) {
          console.error('[Config.js] handleSave: Some configuration updates failed:', failedUpdates);
          failedUpdates.forEach(fail => {
            console.error(`[Config.js] handleSave: Failed update for ID ${fail.id}. Error:`, fail.error.response?.data || fail.error.message);
          });
          throw new Error('save-config-partial-error');
      }

      console.log('[Config.js] handleSave: All updates successful.');
      setSuccessMessage('save-config-success');
    } catch (err) {
      console.error('[Config.js] handleSave: Error during save operation:', err);
      setError(err.message === 'save-config-partial-error' ? err.message : 'save-config-error');
    } finally {
      console.log('[Config.js] handleSave: Save operation finished. Setting isSaving to false.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
       return <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
           <CircularProgress />
           <Typography sx={{ mt: 2 }}><Localized id="loading-config" /></Typography>
       </Container>;
   }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <SettingsIcon />
            </Avatar>
             <Typography component="h1" variant="h4">
                <Localized id="admin-config-title" />
            </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}><Localized id={error} fallback={<Localized id='generic-error-fallback' />} /></Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 3 }}><Localized id={successMessage} fallback={successMessage}/></Alert>}

        <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        <Localized id="team-configurations-title" />
                    </Typography>
                    <Box sx={{ pl: 2, pr: 2 }}>
                        {teamConfigs.map(config => (
                             <Box key={config.id} sx={{ mb: 2 }}>
                                <Typography gutterBottom>{config.team_name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Slider
                                        value={Number(config.config_value) || 1}
                                        min={0.8}
                                        max={1.5}
                                        step={0.01}
                                        onChange={(e, newValue) => handleTeamConfigChange(config.team_name, newValue)}
                                        valueLabelDisplay="auto"
                                        sx={{ flexGrow: 1, mr: 2 }}
                                        disabled={isSaving}
                                    />
                                    <Typography sx={{ minWidth: '40px', textAlign: 'right' }}>
                                        {Number(config.config_value).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
                 <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        <Localized id="race-points-config-title" />
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><Localized id="driver-position" /></TableCell>
                                    <TableCell align="right"><Localized id="points" /></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {racePoints.sort((a, b) => a.position - b.position).map(point => (
                                    <TableRow key={point.id}>
                                        <TableCell component="th" scope="row">
                                            {point.position}
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                value={point.points}
                                                onChange={(e) => handleRacePointChange(point.id, e.target.value)}
                                                size="small"
                                                variant="outlined"
                                                inputProps={{ min: 0 }}
                                                sx={{ width: '80px' }}
                                                disabled={isSaving}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
             <Button 
                variant="contained" 
                onClick={handleSave} 
                disabled={isLoading || isSaving}
                size="large"
                sx={{ position: 'relative' }}
            >
                 <Localized id="save-configurations-button" />
                 {isSaving && (
                     <CircularProgress
                         size={24}
                         sx={{
                             position: 'absolute',
                             top: '50%',
                             left: '50%',
                             marginTop: '-12px',
                             marginLeft: '-12px',
                         }}
                     />
                 )}
            </Button>
        </Box>

    </Container>
  );
};

export default Config;
