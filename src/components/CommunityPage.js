import React, { useState } from 'react';
import { Box, Typography, Container, Tabs, Tab, Paper, Button } from '@mui/material';
import { Localized } from '@fluent/react';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink } from 'react-router-dom';
import SubmissionForm from './SubmissionForm';
import SubmissionsList from './SubmissionsList'; // Import the real list
import EmptyState from './EmptyState';
import { useToast } from './ToastProvider';

function CommunityPage({ isAdmin, isSpectator }) {
    const toast = useToast();
    const [currentTab, setCurrentTab] = useState('channels');
    const [submissionCount, setSubmissionCount] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const handleSubmissionSuccess = () => {
        setSubmissionCount(prev => prev + 1);
        toast.show('success', <Localized id="submission-success-message" />);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, rgba(225,6,0,0.18) 0%, rgba(0,210,190,0.12) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            <Localized id="community-page-title" />
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            <Localized id="community-page-description" />
                        </Typography>
                    </Box>
                    {isSpectator && (
                        <Button 
                            component={RouterLink} 
                            to="/spectator" 
                            variant="outlined" 
                            size="small" 
                            startIcon={<HomeIcon />}
                        >
                            <Localized id="home" />
                        </Button>
                    )}
                </Box>

                <SubmissionForm onSubmissionSuccess={handleSubmissionSuccess} />

                <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
                    <Tabs 
                        value={currentTab} 
                        onChange={handleTabChange} 
                        aria-label="Community content tabs"
                        variant="fullWidth"
                    >
                        <Tab label={<Localized id="community-tab-channels" />} value="channels" />
                        <Tab label={<Localized id="community-tab-videos" />} value="videos" />
                        <Tab label={<Localized id="community-tab-live" />} value="live" />
                    </Tabs>
                </Box>
                
                {currentTab === 'channels' && (
                    <SubmissionsList type="CHANNEL" isAdmin={isAdmin} key={`channels-${submissionCount}`} />
                )}

                {currentTab === 'videos' && (
                    <SubmissionsList type="VIDEO" isAdmin={isAdmin} key={`videos-${submissionCount}`} />
                )}

                {currentTab === 'live' && (
                    <SubmissionsList type="VIDEO" category="LIVE" isAdmin={isAdmin} key={`live-${submissionCount}`} />
                )}
            </Paper>
        </Container>
    );
}

export default CommunityPage; 