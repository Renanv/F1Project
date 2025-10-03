import React from 'react';
import { Localized } from '@fluent/react';
import {
    Typography, Paper, List, ListItem, ListItemText, Card, CardContent, useTheme, useMediaQuery, Box
} from '@mui/material';

// Define Constructor Tiers - This should be the same as in RankingsPage.js or imported if centralized
const constructorTiers = [
    { ranks: [1, 2], name: "McLaren", color: '#FF8700' },
    { ranks: [3, 4], name: "Red Bull", color: '#0600EF' },
    { ranks: [5, 6], name: "Mercedes", color: '#00D2BE' },
    { ranks: [7, 8], name: "Ferrari", color: '#DC0000' },
    { ranks: [9, 10], name: "Aston Martin", color: '#006F62' },
    { ranks: [11, 12], name: "Williams", color: '#005AFF' },
    { ranks: [13, 14], name: "VCARB", color: '#00BFFF' },
    { ranks: [15, 16], name: "Alpine", color: '#0090FF' },
    { ranks: [17, 18], name: "Haas", color: '#FFFFFF', textColor: '#000000' },
    { ranks: [19, 20], name: "Sauber", color: '#00E100' }
];

const ConstructorsRankingsView = ({ drivers, isMobile, championshipConfig }) => {
  const theme = useTheme(); // isMobile prop is passed from parent
  
  // Check the championship configuration
  const isTeamAverageMode = championshipConfig?.constructors_ranking_mode === 'team_average';
  const isReverseOrder = championshipConfig?.constructors_livery_order === 'reverse';

  if (drivers.length === 0) {
    return <Typography sx={{mt: 2}}><Localized id="no-drivers-for-constructors" fallback="No driver data available to generate constructors ranking."/></Typography>;
  }

  if (isTeamAverageMode) {
    // Team average mode: show database teams ranked by average LSF-Score
    return renderTeamAverageMode(drivers, isMobile, isReverseOrder);
  } else {
    // Individual mode: original behavior with F1 constructor tiers
    return renderIndividualMode(drivers, isMobile, isReverseOrder);
  }
};

// Helper function for team average mode (database teams with F1 constructor display)
const renderTeamAverageMode = (drivers, isMobile, isReverseOrder) => {
  // Group drivers by actual database teams (team_id and team_name from teams table)
  const teamGroups = drivers.reduce((acc, driver) => {
    // Use team_id as the key to properly group by actual teams
    const teamKey = driver.team_id ? `${driver.team_id}` : 'no_team';
    const teamName = driver.team_name || 'Sem Equipe';
    
    if (!acc[teamKey]) {
      acc[teamKey] = {
        teamName,
        drivers: []
      };
    }
    acc[teamKey].drivers.push(driver);
    return acc;
  }, {});

  // Calculate team averages and assign to F1 constructor tiers
  const teamAverages = Object.values(teamGroups).map(teamGroup => {
    const { teamName, drivers: teamDrivers } = teamGroup;
    const validScores = teamDrivers.map(driver => parseFloat(driver.display_score) || 0);
    const totalScore = validScores.reduce((sum, score) => sum + score, 0);
    
    // Calculate average: if no drivers, average is 0; otherwise total/count
    let averageScore = 0;
    if (teamDrivers.length > 0) {
      averageScore = totalScore / teamDrivers.length;
      // Ensure we don't get NaN - if all scores are 0 or invalid, average should be 0
      if (isNaN(averageScore) || !isFinite(averageScore)) {
        averageScore = 0;
      }
    }
    
    return {
      teamName,
      drivers: teamDrivers,
      averageScore,
      driverCount: teamDrivers.length
    };
  });

  // Sort teams by average score (best to worst) to assign to F1 constructors
  const sortedTeamsByAverage = teamAverages.sort((a, b) => {
    // In LSF scoring, HIGHER scores are better (just like individual mode)
    // So we want highest average first (best performance)
    return b.averageScore - a.averageScore; // Highest average first (best performance)
  });
  
  // Assign teams to F1 constructor tiers based on their average ranking
  const constructorRanking = [];
  constructorTiers.forEach((tier, tierIndex) => {
    const teamInTier = sortedTeamsByAverage[tierIndex]; // Get the team for this performance rank
    
    // In reverse mode, assign teams to the opposite constructor
    // Best team gets assigned to the last constructor (Sauber) instead of first (McLaren)
    const constructorToUse = isReverseOrder 
      ? constructorTiers[constructorTiers.length - 1 - tierIndex] 
      : tier;
    
    if (teamInTier) { // Only add if there's a team for this rank
      constructorRanking.push({
        tierName: constructorToUse.name,
        color: constructorToUse.color,
        textColor: constructorToUse.textColor || '#FFFFFF',
        team: teamInTier,
        originalRank: tierIndex // Keep track of performance order
      });
    }
  });

  // Always sort by original performance rank to maintain best-first display order
  constructorRanking.sort((a, b) => a.originalRank - b.originalRank);

  return (
    <Paper elevation={1} sx={{ p: isMobile ? 1 : 2 }}>
      {constructorRanking.map((item, index) => (
        <Card key={index} sx={{ mb: 2, backgroundColor: item.color, color: item.textColor }} elevation={3}>
          <CardContent sx={{ p: isMobile ? '12px' : '16px' }}>
            <Typography variant="h6" component="div" sx={{ mb: 1, textAlign: isMobile ? 'center' : 'left' }}>
              {item.tierName}
              {item.team && (
                <span> - {item.team.teamName} (<Localized id="average-score-label" fallback="Média" />: {item.team.averageScore.toFixed(2)})</span>
              )}
            </Typography>
            {item.team && item.team.drivers.length > 0 ? (
              <List dense disablePadding>
                {item.team.drivers
                  .sort((a, b) => (b.display_score || 0) - (a.display_score || 0)) // Sort drivers within team by score
                  .map((driver, driverIndex) => (
                  <ListItem key={driverIndex} sx={{ pt:0, pb: 0.5, pl: isMobile ? 1 : 2}}>
                    <ListItemText 
                      primary={`${driver.name} (#${driver.driver_number})`}
                      secondary={`Score: ${parseFloat(driver.display_score || 0).toFixed(2)}`}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondaryTypographyProps={{ color: 'inherit', opacity: 0.85 }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', pl: isMobile ? 1 : 2, opacity: 0.85}}>
                <Localized id="no-team-in-tier" fallback="No team assigned to this constructor."/>
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Paper>
  );
};

// Helper function for individual mode (original F1 constructor tiers behavior)
const renderIndividualMode = (drivers, isMobile, isReverseOrder) => {
  // Sort by display_score for tiering (this is the original behavior)
  const sortedDriversByScore = [...drivers].sort((a, b) => (b.display_score || 0) - (a.display_score || 0));
  
  const constructorRanking = [];

  // Always use the original constructor order for iteration
  constructorTiers.forEach((tier, tierIndex) => {
      // In reverse mode, assign drivers to the opposite constructor
      // Best drivers (rank 1,2) get assigned to the last constructor (Sauber) instead of first (McLaren)
      const constructorToUse = isReverseOrder 
        ? constructorTiers[constructorTiers.length - 1 - tierIndex] 
        : tier;
      
      const driversInTier = sortedDriversByScore.filter((driver, index) => 
          tier.ranks.includes(index + 1) // Still use original tier ranks for driver selection
      );
      
      // Always add the constructor, even if empty
      constructorRanking.push({
          tierName: constructorToUse.name,
          drivers: driversInTier.map(d => ({ 
              name: d.name, 
              score: d.display_score,
              driver_number: d.driver_number, 
              team_name: d.team_name
          })),
          color: constructorToUse.color,
          textColor: constructorToUse.textColor || '#FFFFFF',
          originalRank: tierIndex // Keep track of performance order
      });
  });

  // Always sort by original performance rank to maintain best-first display order
  constructorRanking.sort((a, b) => a.originalRank - b.originalRank);

  return (
      <Paper elevation={1} sx={{ p: isMobile ? 1 : 2 }}>
          {constructorRanking.map((item, index) => (
              <Card key={index} sx={{ mb: 2, backgroundColor: item.color, color: item.textColor }} elevation={3}>
                  <CardContent sx={{ p: isMobile ? '12px' : '16px' }}>
                      <Typography variant="h6" component="div" sx={{ mb: 1, textAlign: isMobile ? 'center' : 'left' }}>
                          {item.tierName}
                      </Typography>
                      {item.drivers.length > 0 ? (
                          <List dense disablePadding>
                              {item.drivers.map((driver, driverIndex) => (
                                  <ListItem key={driverIndex} sx={{ pt:0, pb: 0.5, pl: isMobile ? 1 : 2}}>
                                      <ListItemText 
                                          primary={`${driver.name} (#${driver.driver_number})`}
                                          secondary={`Score: ${parseFloat(driver.score || 0).toFixed(2)} - ${driver.team_name || 'N/A'}`}
                                          primaryTypographyProps={{ fontWeight: 'medium' }}
                                          secondaryTypographyProps={{ color: 'inherit', opacity: 0.85 }}
                                      />
                                  </ListItem>
                              ))}
                          </List>
                      ) : (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', pl: isMobile ? 1 : 2, opacity: 0.85}}>
                              <Localized id="no-drivers-in-tier" fallback="No drivers in this tier for the selected championship."/>
                          </Typography>
                      )}
                  </CardContent>
              </Card>
          ))}
      </Paper>
  );
};

export default ConstructorsRankingsView; 