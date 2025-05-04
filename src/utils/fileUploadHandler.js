import axios from 'axios';

export const handleFileUpload = async (file, setMessage, setLoading, onSuccess) => {
  if (!file) {
    setMessage('select-file');
    return;
  }

  setLoading(true);
  setMessage('');

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);

      const driverNumbersInFile = data['classification-data'].map(driver => driver['participant-data']['race-number']);
      const updatedDrivers = [];
      const missingDrivers = [];

      // Fetch team configurations
      const teamConfigsResponse = await axios.get('http://localhost:5000/api/team-configs');
      const teamConfigs = teamConfigsResponse.data.reduce((acc, config) => {
        acc[config.team_name.toLowerCase()] = config.config_value;
        return acc;
      }, {});

      // Access the overtakes data within overtakes.records
      const overtakes = Array.isArray(data['overtakes']?.['records']) ? data['overtakes']['records'] : [];

      const overtakingCounts = {};

      overtakes.forEach(overtake => {
        const overtakingDriver = overtake['overtaking-driver-name']?.trim().toLowerCase();
        if (overtakingDriver) {
          overtakingCounts[overtakingDriver] = (overtakingCounts[overtakingDriver] || 0) + 1;
        }
      });

      // Determine the maximum number of overtakes by any driver
      const maxOvertakes = Math.max(...Object.values(overtakingCounts));

      const totalLaps = data['session-info']['total-laps'];

      for (const driver of data['classification-data']) {
        let pointsAdjustment = 0;
        const driverName = driver['driver-name']?.trim().toLowerCase();
        const teamName = driver['participant-data']['team-id']?.toLowerCase();

        // Calculate penalties-time adjustment
        const penalties = driver['final-classification']['penalties-time'];
        if (penalties > 3 && penalties <= 6) pointsAdjustment -= 2;
        else if (penalties > 6 && penalties <= 9) pointsAdjustment -= 3;
        else if (penalties > 9) pointsAdjustment -= 5;
        else if (penalties > 0 && penalties <= 3) pointsAdjustment -= 1;

        // Calculate grid-position adjustment
        const gridPosition = driver['final-classification']['grid-position'];
        if (gridPosition === 1 || gridPosition === 2) pointsAdjustment += 5;
        else if (gridPosition === 3 || gridPosition === 4) pointsAdjustment += 4;
        else if (gridPosition === 5 || gridPosition === 6) pointsAdjustment += 3;
        else if (gridPosition === 7 || gridPosition === 8) pointsAdjustment += 2; 
        else if (gridPosition === 9 || gridPosition === 10) pointsAdjustment += 1;
        else if (gridPosition === 11 || gridPosition === 12) pointsAdjustment += 0;
        else if (gridPosition === 13 || gridPosition === 14) pointsAdjustment += 0;
        else if (gridPosition === 15 || gridPosition === 16) pointsAdjustment -= 1;
        else if (gridPosition === 17 || gridPosition === 18) pointsAdjustment -= 2;
        else if (gridPosition === 19 || gridPosition === 20) pointsAdjustment -= 3;

        // Calculate delta-to-race-leader-in-ms adjustment
        const deltaToLeader = driver['lap-data']['delta-to-race-leader-in-ms'];
        if (deltaToLeader >= 0 && deltaToLeader <= 3000) pointsAdjustment += 5;
        else if (deltaToLeader > 3000 && deltaToLeader <= 5000) pointsAdjustment += 4;
        else if (deltaToLeader > 5000 && deltaToLeader <= 7000) pointsAdjustment += 3;
        else if (deltaToLeader > 7000 && deltaToLeader <= 10000) pointsAdjustment += 2;
        else if (deltaToLeader > 10000 && deltaToLeader <= 15000) pointsAdjustment += 1;
        else if (deltaToLeader > 15000) pointsAdjustment += 0;

        // Check if the driver has been lapped
        const lapsCompleted = driver['final-classification']['num-laps'];
        if (lapsCompleted < totalLaps) {
          pointsAdjustment -= 2;
        }

        const finishedRace = driver['final-classification']['result-status'];
        if (finishedRace !== 'FINISHED') {
          pointsAdjustment -= 3;
        }

        // Calculate overtakes adjustment based on percentage
        const overtakingCount = overtakingCounts[driverName] || 0;
        const overtakePercentage = (overtakingCount / maxOvertakes) * 100;

        if (overtakePercentage === 100) pointsAdjustment += 5;
        else if (overtakePercentage >= 96) pointsAdjustment += 4;
        else if (overtakePercentage >= 85) pointsAdjustment += 3;
        else if (overtakePercentage >= 70) pointsAdjustment += 2;
        else if (overtakePercentage >= 51) pointsAdjustment += 1;
        else if (overtakePercentage >= 30) pointsAdjustment += 0;
        else if (overtakePercentage >= 20) pointsAdjustment -= 1;
        else pointsAdjustment -= 2;

        // Apply team multiplier
        const teamMultiplier = teamConfigs[teamName] || 1;
        pointsAdjustment = (pointsAdjustment / 4) * teamMultiplier;

        // Use pointsAdjustment as the final points
        driver['final-classification']['points'] = pointsAdjustment;
        updatedDrivers.push(driver);
      }

      // Fetch all drivers from the database
      const response = await axios.get('http://localhost:5000/api/drivers');
      const allDrivers = response.data;

      // Identify missing drivers
      allDrivers.forEach(dbDriver => {
        if (!driverNumbersInFile.includes(dbDriver.driver_number)) {
          missingDrivers.push({
            driver_number: dbDriver.driver_number,
            points: dbDriver.points
          });
        }
      });

      // Send missing drivers to the server to log them
      await axios.post('http://localhost:5000/api/log-missing-drivers', { missingDrivers });

      // Send updated data to the server
      await axios.post('http://localhost:5000/api/update-driver-points', { drivers: updatedDrivers });

      setMessage('file-processed-success');
      if (onSuccess) onSuccess(); // Call the success callback
    } catch (error) {
      console.error('Error processing file:', error.message || error);
      setMessage('file-processing-error');
    } finally {
      setLoading(false);
    }
  };

  reader.readAsText(file);
}; 