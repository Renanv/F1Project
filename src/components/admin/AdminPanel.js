import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Grid, Card, CardActionArea, CardContent, Box } from '@mui/material';
// You might need to install @mui/icons-material: npm install @mui/icons-material
import SettingsIcon from '@mui/icons-material/Settings'; 
import GroupIcon from '@mui/icons-material/Group'; 
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import { Localized } from '@fluent/react';

function AdminPanel() {

  // Define the sections available in the admin panel
  const adminSections = [
    {
      titleId: 'admin-link-championships', // Localization ID for the title
      descriptionId: 'admin-desc-championships', // Localization ID for the description
      link: '/admin/championships', // Route path
      icon: <EmojiEventsIcon fontSize="large" /> // Icon component
    },
    {
      titleId: 'admin-link-teams',
      descriptionId: 'admin-desc-teams',
      link: '/admin/teams',
      icon: <GroupIcon fontSize="large" />
    },
    {
      titleId: 'admin-link-config',
      descriptionId: 'admin-desc-config',
      link: '/config', // Assuming /config is admin-only based on previous structure
      icon: <SettingsIcon fontSize="large" />
    }
    // Add more admin sections here by following the same structure
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <Localized id="admin-panel-title" />
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {adminSections.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.link}>
            <Card elevation={3} sx={{ height: '100%' }}> {/* Ensure cards have same height */}
              <CardActionArea component={RouterLink} to={section.link} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2, color: 'primary.main' }}> {/* Added color to icon */}
                    {section.icon}
                  </Box>
                  <Typography gutterBottom variant="h6" component="div">
                    <Localized id={section.titleId} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                     <Localized id={section.descriptionId} />
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default AdminPanel; 