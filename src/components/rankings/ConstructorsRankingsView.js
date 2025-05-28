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

const ConstructorsRankingsView = ({ drivers, isMobile }) => {
  const theme = useTheme(); // isMobile prop is passed from parent

  // Sort by display_score for tiering
  const sortedDriversByScore = [...drivers].sort((a, b) => (b.display_score || 0) - (a.display_score || 0));
  const constructorRanking = [];

  constructorTiers.forEach(tier => {
      const driversInTier = sortedDriversByScore.filter((driver, index) => 
          tier.ranks.includes(index + 1) // index+1 is the rank
      );
      constructorRanking.push({
          tierName: tier.name,
          drivers: driversInTier.map(d => ({ 
              name: d.name, 
              score: d.display_score,
              driver_number: d.driver_number, 
              team_name: d.team_name
          })),
          color: tier.color,
          textColor: tier.textColor || '#FFFFFF'
      });
  });

  if (drivers.length === 0) {
    return <Typography sx={{mt: 2}}><Localized id="no-drivers-for-constructors" fallback="No driver data available to generate constructors ranking."/></Typography>;
  }

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