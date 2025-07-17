import React, { useState } from 'react';
import { Box, Typography, Container, Tabs, Tab, Paper } from '@mui/material';
import { Localized } from '@fluent/react';
import SubmissionForm from './SubmissionForm';
import SubmissionsList from './SubmissionsList'; // Import the real list

function CommunityPage({ isAdmin }) {
    const [currentTab, setCurrentTab] = useState('channels');
    const [submissionCount, setSubmissionCount] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const handleSubmissionSuccess = () => {
        setSubmissionCount(prev => prev + 1);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    <Localized id="community-page-title" />
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    <Localized id="community-page-description" />
                </Typography>

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