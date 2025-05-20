import React from 'react';
import { Localized } from '@fluent/react';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, 
    Box, Card, CardContent, useTheme, useMediaQuery
} from '@mui/material';

const DriverRankingsView = ({ drivers, isMobile }) => {
  const theme = useTheme(); // Assuming isMobile is derived using useTheme and useMediaQuery in the parent

  const renderDriverCard = (driver, index) => {
    const formattedScore = typeof driver.display_score === 'number' 
        ? driver.display_score.toFixed(2) 
        : (typeof driver.display_score === 'string' ? parseFloat(driver.display_score).toFixed(2) : '0.00');
    const actualPoints = (driver.points != null ? driver.points : 0) + 
                         (driver.bonus_points != null ? driver.bonus_points : 0);
    const teamName = driver.team_name || 'N/A';

    return (
      <Grid item xs={12} key={driver.user_id || driver.id}>
        <Card sx={{ mb: 2 }} elevation={2}>
          <CardContent sx={{ p: 2 }}> 
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h6" component="div">
                {index + 1}. {driver.name}
              </Typography>
              <Typography variant="body2" component="span" color="text.secondary">
                #{driver.driver_number}
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
              </Box>
              <Box sx={{ ml: 1 }}> 
                <Typography variant="h3" component="span" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {actualPoints}
                </Typography>
              </Box>
            </Box>
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
            <TableCell><Localized id="driver-number" /></TableCell>
            <TableCell><Localized id="driver-team" /></TableCell>
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

            return (
              <TableRow hover key={driver.user_id || driver.id}> 
                <TableCell component="th" scope="row">{index + 1}</TableCell>
                <TableCell>{driver.name}</TableCell>
                <TableCell>{driver.driver_number}</TableCell>
                <TableCell>{teamName ? teamName : <Localized id="team-name-not-available" />}</TableCell>
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