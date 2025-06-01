import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Grid, Card, CardActionArea, CardContent, Box, Avatar } from '@mui/material';
// You might need to install @mui/icons-material: npm install @mui/icons-material
import SettingsIcon from '@mui/icons-material/Settings'; 
import GroupIcon from '@mui/icons-material/Group'; 
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Import for title
import CollectionsIcon from '@mui/icons-material/Collections'; // Import for Uploaded Files
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
    },
    {
      titleId: 'admin-uploaded-files-nav-link', // Use existing ID from nav link
      descriptionId: 'admin-desc-uploaded-files', // New ID for description
      link: '/admin/uploaded-files',
      icon: <CollectionsIcon fontSize="large" />
    }
    // Add more admin sections here by following the same structure
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Wider container */}
       <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <AdminPanelSettingsIcon />
            </Avatar>
            <Typography component="h1" variant="h4">
                 {/* Use the existing admin-panel-link key for the title */}
                <Localized id="admin-panel-link" /> 
            </Typography>
       </Box>

      <Grid container spacing={4} justifyContent="center"> {/* Center grid items */}
        {adminSections.map((section) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={section.link}> {/* Adjusted grid sizing */}
            <Card elevation={3} sx={{ height: '100%' }}> {/* Ensure cards have same height */}
              <CardActionArea component={RouterLink} to={section.link} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2 }}> {/* Added padding */}
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