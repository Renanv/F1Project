import React from 'react';
import { Localized } from '@fluent/react';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid,
    Box, Card, CardContent, useTheme, useMediaQuery
} from '@mui/material';

const TeamRankingsView = ({ teamRankings, isMobile }) => {
  const theme = useTheme();

  const renderTeamCard = (team, index) => (
    <Grid item xs={12} key={team.team_id}>
      <Card sx={{ mb: 2 }} elevation={2}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
            <Typography variant="h6" component="div">
              {index + 1}. {team.team_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <Typography variant="h3" component="span" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
              {team.total_team_points}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderTeamTableContent = () => (
    <TableContainer component={Paper}>
      <Table stickyHeader aria-label="team rankings table">
        <TableHead>
          <TableRow>
            <TableCell><Localized id="team-position" fallback="Rank" /></TableCell>
            <TableCell><Localized id="team-name" fallback="Team" /></TableCell>
            <TableCell><Localized id="team-total-points" fallback="Total Points" /></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teamRankings.map((team, index) => (
            <TableRow 
              hover 
              key={team.team_id}
              sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}
            >
              <TableCell component="th" scope="row">{index + 1}</TableCell>
              <TableCell>{team.team_name}</TableCell>
              <TableCell>{team.total_team_points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (teamRankings.length === 0) {
    return <Typography sx={{mt: 2}}><Localized id="no-team-rankings-found" fallback="No team rankings found for this championship."/></Typography>;
  }

  return isMobile ? (
    <Grid container spacing={0}> 
        {teamRankings.map((team, index) => renderTeamCard(team, index))}
    </Grid>
  ) : renderTeamTableContent();
};

export default TeamRankingsView; 