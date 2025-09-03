import React from 'react';
import { Localized } from '@fluent/react';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, 
    Box, Card, CardContent, useTheme, useMediaQuery, Accordion, AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCountryCodeForRace } from '../../utils/raceToCountryCode';

const Flag = ({ countryCode, raceName }) => {
    // Special case for "Surpresa" races
    if (raceName && raceName.toLowerCase().includes('surpresa')) {
        return (
            <Tooltip title={raceName}>
                <Box sx={{
                    width: '32px',
                    height: '24px',
                    backgroundColor: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '2px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    verticalAlign: 'middle'
                }}>
                    ?
                </Box>
            </Tooltip>
        );
    }

    return (
        <Tooltip title={raceName}>
            <img
                src={`https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`}
                alt={raceName}
                style={{ width: '32px', height: '24px', verticalAlign: 'middle' }}
            />
        </Tooltip>
    );
};

const DriverRankingsView = ({ drivers, isMobile, races = [], pointsByRaceData = null }) => {
  const theme = useTheme(); // Assuming isMobile is derived using useTheme and useMediaQuery in the parent

  // Helper function to get position styling
  const getPositionStyle = (position, hasFastestLap = false) => {
    let color = '#42A5F5'; // Light blue instead of white/black for better contrast with silver
    let fontWeight = 'normal';
    
    if (position <= 3) {
      // Podium colors (regardless of fastest lap)
      if (position === 1) color = '#FFD700'; // Gold
      else if (position === 2) color = '#C0C0C0'; // Silver
      else if (position === 3) color = '#CD7F32'; // Bronze
      fontWeight = 'bold';
    }
    // Fastest lap just gets the circle, no color change
    
    return { color, fontWeight };
  };

  // Helper function to render position indicator with optional circle
  const renderPositionIndicator = (position, hasFastestLap = false, isPodium = false) => {
    const style = getPositionStyle(position, hasFastestLap);
    
    if (hasFastestLap && isPodium) {
      // Show podium color with purple circle border around the value
      return (
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '2px solid #9C27B0',
          backgroundColor: 'transparent'
        }}>
          <Typography style={style}>{position}</Typography>
        </Box>
      );
    }
    
    return <Typography style={style}>{position}</Typography>;
  };

  const renderDriverCard = (driver, index) => {
    const formattedScore = typeof driver.display_score === 'number' 
        ? driver.display_score.toFixed(2) 
        : (typeof driver.display_score === 'string' ? parseFloat(driver.display_score).toFixed(2) : '0.00');
    const actualPoints = (driver.points != null ? driver.points : 0) + 
                         (driver.bonus_points != null ? driver.bonus_points : 0);
    const teamName = driver.team_name || 'N/A';

    // Get race points data for this driver if available
    const driverRaceData = pointsByRaceData?.driverRankings?.find(
      ranking => ranking.driverInfo.userId === (driver.user_id || driver.id)
    );

    const position = index + 1;

    return (
      <Grid item xs={12} key={driver.user_id || driver.id}>
        <Card sx={{ mb: 2 }} elevation={2}>
          <CardContent sx={{ p: 2 }}> 
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h6" component="div">
                {position}. {driver.name} #{driver.driver_number}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Box>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  <Localized id="driver-team" />: {teamName ? teamName : <Localized id="team-name-not-available" />}
                </Typography>
                <Typography variant="body1">
                  <Localized id="driver-table-score" />: <Localized id="driver-score-value" vars={{ score: formattedScore }}><span>{formattedScore} pts</span></Localized>
                </Typography>
                {driverRaceData && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    justifyContent: 'space-between', 
                    mt: 1, 
                    gap: 1 
                  }}>
                    <Typography variant="body2">
                      <Localized id="total-race-points" fallback="Race Points"/>: {driverRaceData.totalPointsFromRaces}
                    </Typography>
                    <Typography variant="body2">
                      <Localized id="bonus-points" fallback="Bonus"/>: {driverRaceData.bonusPoints}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ ml: 1 }}> 
                <Typography variant="h3" component="span" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {actualPoints}
                </Typography>
              </Box>
            </Box>
            {driverRaceData && races.length > 0 && (
              <Accordion sx={{ mt: 2, boxShadow: 'none', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2"><Localized id="show-race-details" fallback="Show Race Details"/></Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><Localized id="race" fallback="Race"/></TableCell>
                        <TableCell align="right"><Localized id="points" fallback="Points"/></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {races.map(race => {
                        const racePoints = driverRaceData.racePoints[race.id];
                        const hasFastestLapInRace = driverRaceData?.raceFastestLaps?.[race.id];
                        const isRacePodium = racePoints !== null && racePoints !== 'DNF' && racePoints >= 15;
                        
                        return (
                          <TableRow key={`${driver.user_id || driver.id}-${race.id}-mobile`}>
                            <TableCell>
                              {getCountryCodeForRace(race.title) || race.title.toLowerCase().includes('surpresa') ? 
                                <Flag countryCode={getCountryCodeForRace(race.title)} raceName={race.title} /> : 
                                race.title
                              }
                            </TableCell>
                            <TableCell align="right">
                              {racePoints !== null ? 
                                (racePoints === 'DNF' ? 
                                  <span style={{ color: 'red', fontWeight: 'bold' }}>DNF</span> : 
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, position: 'relative' }}>
                                    <Typography style={getPositionStyle(
                                      // Estimate position from points
                                      racePoints >= 25 ? 1 : racePoints >= 18 ? 2 : racePoints >= 15 ? 3 : 99,
                                      hasFastestLapInRace
                                    )}>
                                      {racePoints}
                                    </Typography>
                                    {hasFastestLapInRace && (
                                      <Box sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        border: '2px solid #9C27B0',
                                        pointerEvents: 'none'
                                      }} />
                                    )}
                                  </Box>
                                ) : '—'
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderDriverTableContent = () => (
    <TableContainer component={Paper}>
      <Table stickyHeader aria-label="driver rankings table">
        <TableHead>
          <TableRow>
            <TableCell><Localized id="driver-position" /></TableCell>
            <TableCell><Localized id="driver-name" /></TableCell>
            <TableCell><Localized id="driver-team" /></TableCell>
                                    {races.map(race => {
                            const countryCode = getCountryCodeForRace(race.title);
                            return (
                                <TableCell key={race.id} align="center">
                                    {countryCode || race.title.toLowerCase().includes('surpresa') ? 
                                        <Flag countryCode={countryCode} raceName={race.title} /> : 
                                        race.title
                                    }
                                </TableCell>
                            );
                        })}
            <TableCell align="center"><Localized id="total-race-points" fallback="Total Race Points" /></TableCell>
            <TableCell align="center"><Localized id="bonus-points" fallback="Bonus" /></TableCell>
            <TableCell><Localized id="driver-table-score" /></TableCell>
            <TableCell><Localized id="driver-table-points" /></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {drivers.map((driver, index) => {
            const formattedScore = typeof driver.display_score === 'number' 
                ? driver.display_score.toFixed(2) 
                : (typeof driver.display_score === 'string' ? parseFloat(driver.display_score).toFixed(2) : '0.00');
            const actualPoints = (driver.points != null ? driver.points : 0) + 
                                 (driver.bonus_points != null ? driver.bonus_points : 0);
            const teamName = driver.team_name || 'N/A';

            // Get race points data for this driver if available
            const driverRaceData = pointsByRaceData?.driverRankings?.find(
              ranking => ranking.driverInfo.userId === (driver.user_id || driver.id)
            );

            const position = index + 1;

            return (
              <TableRow 
                hover 
                key={driver.user_id || driver.id}
                sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}
              > 
                <TableCell component="th" scope="row">
                  {position}
                </TableCell>
                <TableCell>{driver.name} #{driver.driver_number}</TableCell>
                <TableCell>{teamName ? teamName : <Localized id="team-name-not-available" />}</TableCell>
                {races.map(race => {
                  const racePoints = driverRaceData?.racePoints?.[race.id];
                  const hasFastestLapInRace = driverRaceData?.raceFastestLaps?.[race.id];
                  const isRacePodium = racePoints !== null && racePoints !== 'DNF' && racePoints >= 15; // Assuming 15+ points means podium finish
                  
                  return (
                    <TableCell key={`${driver.user_id || driver.id}-${race.id}`} align="center">
                      {racePoints !== null && racePoints !== undefined ? 
                        (racePoints === 'DNF' ? 
                          <span style={{ color: 'red', fontWeight: 'bold' }}>DNF</span> : 
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, position: 'relative' }}>
                            <Typography style={getPositionStyle(
                              // Estimate position from points (this is approximate)
                              racePoints >= 25 ? 1 : racePoints >= 18 ? 2 : racePoints >= 15 ? 3 : 99,
                              hasFastestLapInRace
                            )}>
                              {racePoints}
                            </Typography>
                            {hasFastestLapInRace && (
                              <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: '2px solid #9C27B0',
                                pointerEvents: 'none'
                              }} />
                            )}
                          </Box>
                        ) : '—'
                      }
                    </TableCell>
                  );
                })}
                <TableCell align="center">{driverRaceData?.totalPointsFromRaces || 0}</TableCell>
                <TableCell align="center">{driverRaceData?.bonusPoints || 0}</TableCell>
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

  if (drivers.length === 0) {
    return <Typography sx={{mt: 2}}><Localized id="no-drivers-found" /></Typography>;
  }

  return isMobile ? (
      <Grid container spacing={0}> 
          {drivers.map((driver, index) => renderDriverCard(driver, index))}
      </Grid>
  ) : renderDriverTableContent();
};

export default DriverRankingsView; 