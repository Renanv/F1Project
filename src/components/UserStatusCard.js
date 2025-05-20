import React from 'react';
import { Localized } from '@fluent/react';
import {
  Card, CardContent, Typography, Grid, List, ListItem, ListItemIcon, ListItemText, Avatar, IconButton
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import StarIcon from '@mui/icons-material/Star';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EventIcon from '@mui/icons-material/Event';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';

function UserStatusCard({ status, teamData, raceData, onOpenBonusLog }) {
  if (!status) {
    return null; // Or some loading/placeholder
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom sx={{ textAlign: 'center' }}>
          <Localized id="my-status-title" /> {status.championshipName ? `(${status.championshipName})` : ''}
        </Typography>
        <Grid container spacing={2} alignItems="stretch">
          <Grid item xs={12} md={status.lastRace ? 4 : 6}>
            <Typography variant="h6" gutterBottom><Localized id="my-current-standing" /></Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><GroupIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary={<Localized id="team-label" />} 
                  secondary={teamData?.teamName ? teamData.teamName : <Localized id="team-name-not-available" />}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SportsScoreIcon color="primary" /></ListItemIcon>
                <ListItemText primary={<Localized id="points-label" />} secondary={status.points !== null ? status.points : '0'} />
              </ListItem>
              <ListItem>
                <ListItemIcon><StarIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary={<Localized id="bonus-points-label" fallback="Bonus Points"/>}
                  secondary={status.bonusPoints !== null ? status.bonusPoints : '0'} 
                />
                {status.attendeeId && (
                   <IconButton onClick={onOpenBonusLog} size="small" edge="end" aria-label="view bonus log">
                       <ListAltIcon />
                   </IconButton>
                )}
              </ListItem>
              <ListItem>
                <ListItemIcon><GroupIcon color="primary" /></ListItemIcon>
                <ListItemText primary={<Localized id="teammate-points-label" />} secondary={teamData?.teammatePoints !== null ? teamData.teammatePoints : '0'} />
              </ListItem>
            </List>
          </Grid>

          {status.lastRace && raceData && (
            <Grid item xs={12} md={4}>
              { console.log('DEBUG status.lastRace (in UserStatusCard):', JSON.stringify(status.lastRace, null, 2)) }
              <Typography variant="h6" gutterBottom>
                <Localized 
                  id="last-race-result-title" 
                  vars={{ raceName: raceData?.raceName || '' }}
                />
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><EventIcon color="secondary"/></ListItemIcon>
                  <ListItemText 
                    primary={<Localized id="race-date-label" />} 
                    secondary={
                      raceData?.date 
                      ? new Date(raceData.date).toLocaleDateString('en-GB') 
                      : 'N/A'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><FormatListNumberedIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary={<Localized id="position-label" />} secondary={raceData?.position} />
                  {raceData && [1, 2, 3].includes(raceData.position) && (
                    <EmojiEventsIcon sx={{
                      marginLeft: 'auto',
                      color: raceData.position === 1 ? '#FFD700'
                             : raceData.position === 2 ? '#C0C0C0'
                             : '#CD7F32'
                    }} />
                  )}
                </ListItem>
                <ListItem>
                  <ListItemIcon><TimerIcon color="secondary" /></ListItemIcon>
                  <ListItemText 
                    primary={<Localized id="fastest-lap-label" />} 
                    secondary={raceData?.fastestLap || 'N/A'} 
                    secondaryTypographyProps={{
                      sx: {
                        color: raceData.isOverallFastestLap ? 'secondary.main' : 'inherit',
                        fontWeight: raceData.isOverallFastestLap ? 'bold' : 'normal' 
                      }
                    }}
                  />
                </ListItem>
              </List>
            </Grid>
          )}
          <Grid item xs={12} md={status.lastRace ? 4 : 6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar sx={{
                  width: 100, 
                  height: 100, 
                  fontSize: '2rem',
                  bgcolor: status.rank === 1 ? '#FFD700'
                           : status.rank === 2 ? '#C0C0C0'
                           : status.rank === 3 ? '#CD7F32'
                           : 'primary.main'
                }}>
                    {status.rank !== null ? status.rank : '-'}
                </Avatar>
            </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default UserStatusCard; 