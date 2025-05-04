import React, { useEffect, useState } from 'react';
import { Container, Typography, Slider, Box, Button, TextField } from '@mui/material';
import { Localized } from '@fluent/react';
import axios from 'axios';

const Config = () => {
  const [configs, setConfigs] = useState([]);
  const [racePoints, setRacePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;  


  useEffect(() => {
    fetchConfigs();
    fetchRacePoints();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/team-configs`);
      setConfigs(response.data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const fetchRacePoints = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/race-points-config`);
      setRacePoints(response.data);
    } catch (error) {
      console.error('Error fetching race points:', error);
    }
  };

  const handleSliderChange = (teamName, newValue) => {
    setConfigs(configs.map(config =>
      config.team_name === teamName ? { ...config, config_value: newValue } : config
    ));
  };

  const handlePointsChange = (position, newValue) => {
    setRacePoints(racePoints.map(point =>
      point.position === position ? { ...point, points: newValue } : point
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const config of configs) {
        await axios.post(`${apiUrl}/api/update-team-config`, {
          teamName: config.team_name,
          configValue: config.config_value,
        });
      }
      for (const point of racePoints) {
        await axios.post(`${apiUrl}/api/update-race-points-config`, {
          position: point.position,
          points: point.points,
        });
      }
      alert('Configurations updated successfully.');
    } catch (error) {
      console.error('Error updating configs:', error);
      alert('Failed to update configurations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={loading}
        sx={{ mb: 4 }}
      >
        <Localized id="save-configurations-button" />
      </Button>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            <Localized id="team-configurations-title" />
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {configs.map(config => (
              <Box key={config.id} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ flex: 1, minWidth: '100px' }}>{config.team_name}</Typography>
                <Slider
                  value={config.config_value}
                  min={0.8}
                  max={1.5}
                  step={0.01}
                  onChange={(e, newValue) => handleSliderChange(config.team_name, newValue)}
                  valueLabelDisplay="auto"
                  sx={{ flex: 2 }}
                />
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            <Localized id="race-points-config-title" />
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {racePoints.map(point => (
              <Box key={point.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ flex: 1, minWidth: '40px', mr: 1 }}>{point.position}</Typography>
                <TextField
                  type="number"
                  value={point.points}
                  onChange={(e) => handlePointsChange(point.position, parseInt(e.target.value, 10))}
                  sx={{ flex: 2, maxWidth: '50px' }}
                  inputProps={{ style: { padding: '4px' } }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Config;
