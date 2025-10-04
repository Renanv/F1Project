import axiosInstance from './axiosInstance'; // Use standard axios

export const handleFileUpload = async (file, setMessage, setLoading, onSuccess, raceId, useMultiplier = false) => {
  if (!file) {
    setMessage('select-file');
    return;
  }

  if (!raceId) {
    setMessage('select-race-error');
    return;
  }

  setLoading(true);
  setMessage('');

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);

      const driverRaceResults = [];

      // Fetch team configurations using standard axios
      const teamConfigsResponse = await axiosInstance.get('/api/team-configs');
      const teamConfigs = teamConfigsResponse.data.reduce((acc, config) => {
        acc[config.team_name.toLowerCase()] = config.config_value;
        return acc;
      }, {});

      // Overtakes calculation
      const overtakes = Array.isArray(data['overtakes']?.['records']) ? data['overtakes']['records'] : [];
      const overtakingCounts = {}; // Counts for ALL drivers in overtake records
      overtakes.forEach(overtake => {
        const overtakingDriver = overtake['overtaking-driver-name']?.trim().toLowerCase();
        if (overtakingDriver) {
          overtakingCounts[overtakingDriver] = (overtakingCounts[overtakingDriver] || 0) + 1;
        }
      });

      // --- Refine maxOvertakes calculation ---
      // Get driver names (lowercase) from the classification data we are processing
      const classificationDriverNames = new Set(
        data['classification-data'].map(d => d['driver-name']?.trim().toLowerCase()).filter(Boolean)
      );

      // Filter the counts to only include drivers present in classification-data
      const relevantOvertakeCounts = Object.entries(overtakingCounts)
        .filter(([driverName, count]) => classificationDriverNames.has(driverName))
        .map(([driverName, count]) => count); // Get just the counts
      // Determine the maximum number of overtakes AMONG RELEVANT drivers
      const maxOvertakes = relevantOvertakeCounts.length > 0 ? Math.max(...relevantOvertakeCounts) : 0; // Use 0 if no relevant counts
      // --- End refine maxOvertakes ---
      const totalLaps = data['session-info']['total-laps'];

      for (const driver of data['classification-data']) {
        // --- Calculate individual score components --- 
        let score_penalties = 0;
        let score_grid_position = 0;
        let score_delta_leader = 0; // This will hold the final value based on rules
        let score_overtakes = 0;
        let score_laps_completed_log = 0; // For logging only
        let score_finish_status_log = 0; // For logging only
        
        const driverName = driver['driver-name']?.trim().toLowerCase();
        const teamName = driver['participant-data']['team-id']?.toLowerCase(); 
        const driverNumber = driver['participant-data']['race-number']; 

        // --- Penalties Score ---
        const penalties = driver['final-classification']['penalties-time'];
        if (penalties > 3 && penalties <= 6) score_penalties = -2;
        else if (penalties > 6 && penalties <= 9) score_penalties = -3;
        else if (penalties > 9) score_penalties = -5;
        else if (penalties > 0 && penalties <= 3) score_penalties = -1;

        // --- Grid Position Score ---
        const gridPosition = driver['final-classification']['grid-position'];
        if (gridPosition === 1 || gridPosition === 2) score_grid_position = 5;
        else if (gridPosition === 3 || gridPosition === 4) score_grid_position = 4;
        else if (gridPosition === 5 || gridPosition === 6) score_grid_position = 3;
        else if (gridPosition === 7 || gridPosition === 8) score_grid_position = 2;
        else if (gridPosition === 9 || gridPosition === 10) score_grid_position = 1;
        else if (gridPosition === 15 || gridPosition === 16) score_grid_position = -1;
        else if (gridPosition === 17 || gridPosition === 18) score_grid_position = -2;
        else if (gridPosition === 19 || gridPosition === 20) score_grid_position = -3;

        // --- Delta/Lapped/DNF Score (Hierarchical) ---
        const deltaToLeader = driver['lap-data']?.['delta-to-race-leader-in-ms'];
        const lapsCompleted = driver['final-classification']?.['num-laps'];
        const finishedRace = driver['final-classification']?.['result-status'];

        if (finishedRace !== 'FINISHED') {
            score_delta_leader = -3; // DNF rule overrides others
            score_finish_status_log = -3; // Log the DNF penalty separately
        } else if (lapsCompleted < totalLaps) {
            score_delta_leader = -2; // Lapped rule overrides time delta
            score_laps_completed_log = -2; // Log the lapped penalty separately
        } else {
            // Only apply time delta if finished on lead lap
            if (deltaToLeader >= 0 && deltaToLeader <= 3000) score_delta_leader = 5;
            else if (deltaToLeader > 3000 && deltaToLeader <= 5000) score_delta_leader = 4;
            else if (deltaToLeader > 5000 && deltaToLeader <= 7000) score_delta_leader = 3;
            else if (deltaToLeader > 7000 && deltaToLeader <= 10000) score_delta_leader = 2;
            else if (deltaToLeader > 10000 && deltaToLeader <= 15000) score_delta_leader = 1;
            // else score_delta_leader remains 0 (for > 15000 or undefined deltaToLeader)
        }
        // --- End Delta/Lapped/DNF Score ---

        // --- Overtakes Score ---
        const overtakingCount = overtakingCounts[driverName] || 0;
        const overtakePercentage = maxOvertakes > 0 ? (overtakingCount / maxOvertakes) * 100 : 0;
        if (overtakePercentage === 100) score_overtakes = 5;
        else if (overtakePercentage >= 96) score_overtakes = 4;
        else if (overtakePercentage >= 85) score_overtakes = 3;
        else if (overtakePercentage >= 70) score_overtakes = 2;
        else if (overtakePercentage >= 51) score_overtakes = 1;
        else if (overtakePercentage >= 20) score_overtakes = -1;
        else score_overtakes = -2;
        
        // --- Calculate total score adjustment FOR THIS RACE ---
        // Uses the final determined score_delta_leader, excludes separate log values
        const raceScoreAdjustment = score_penalties + score_delta_leader + score_overtakes;
        
        // Apply team multiplier
        const teamMultiplier = teamConfigs[teamName] || 1;
        const finalRaceScore = raceScoreAdjustment * teamMultiplier;

        // --- Prepare data object for this driver for the backend --- 
        const resultData = {
            driverNumber: driverNumber,
            raceId: raceId, 
            livery: driver['participant-data']?.['team-id'],
            qualification: gridPosition, // Use calculated gridPosition
            position: driver['final-classification']?.position,
            fastest_lap: driver['final-classification']?.['best-lap-time-str'], 
            resultStatus: finishedRace,
            // Individual Score Components for Logging
            score_penalties: score_penalties,
            score_grid_position: score_grid_position,
            score_delta_leader: score_delta_leader, // Log the final combined value
            score_overtakes: score_overtakes,
            score_laps_completed: score_laps_completed_log, // Use the specific log value
            score_finish_status: score_finish_status_log,  // Use the specific log value
            // Send the final calculated score adjustment for THIS RACE
            finalRaceScore: finalRaceScore 
        };

        driverRaceResults.push(resultData);
      }

      // Send the array of driver race results to the backend
      await axiosInstance.post('/api/log-race-results', { 
        results: driverRaceResults, 
        pointsMultiplier: useMultiplier ? 2 : 1 
      });

      setMessage('file-processed-success');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error processing file:', error.message || error);
      setMessage(error.response?.data?.message || 'file-processing-error');
    } finally {
      setLoading(false);
    }
  };

  reader.readAsText(file);
}; 