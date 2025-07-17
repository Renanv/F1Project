import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar, Grid, Button, Link } from '@mui/material';
import { Localized } from '@fluent/react';

function SubmissionCard({ submission, onStatusChange, isAdmin }) {

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'APPROVED':
                return 'success';
            case 'REJECTED':
                return 'error';
            case 'PENDING':
            default:
                return 'warning';
        }
    };

    const getCategoryLocalizationId = (category) => {
        const categoryMap = {
            LIVE: 'submission-category-live',
            SWITCHBACK: 'submission-category-switchback',
            DOUBLE_OVERTAKE: 'submission-category-double-overtake',
            TRIPLE_OVERTAKE: 'submission-category-triple-overtake',
        };
        return categoryMap[category] || category;
    };
    
    const getSubmissionTypeLocalizationId = (type) => {
        return type === 'CHANNEL' ? 'submission-type-channel' : 'submission-type-video';
    }

    return (
        <Card sx={{ mb: 3 }} elevation={2}>
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar src={submission.driver_picture_url || ''} sx={{ width: 40, height: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle1" component="div">
                                    <Link href={submission.url} target="_blank" rel="noopener noreferrer" underline="hover">
                                        <Localized id={getSubmissionTypeLocalizationId(submission.type)} />
                                    </Link>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <Localized id="submission-by-label" /> {submission.usertag || submission.username}
                                </Typography>
                            </Box>
                        </Box>
                        {submission.type === 'VIDEO' && submission.category && (
                             <Chip label={<Localized id={getCategoryLocalizationId(submission.category)} />} size="small" sx={{ ml: 'auto' }} />
                        )}
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                        <Chip
                            label={<Localized id={`submission-status-${submission.status.toLowerCase()}`} />}
                            color={getStatusChipColor(submission.status)}
                            size="small"
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            {new Date(submission.submitted_at).toLocaleDateString()}
                        </Typography>
                    </Grid>
                </Grid>

                {isAdmin && submission.type === 'VIDEO' && submission.status === 'PENDING' && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => onStatusChange(submission.id, 'APPROVED')}
                        >
                            <Localized id="submission-approve-button" />
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => onStatusChange(submission.id, 'REJECTED')}
                        >
                            <Localized id="submission-reject-button" />
                        </Button>
                    </Box>
                )}

                {submission.status !== 'PENDING' && submission.reviewer_username && (
                    <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'right', fontStyle: 'italic' }}>
                        <Localized id="submission-reviewed-by-label" vars={{ name: submission.reviewer_username }}>
                            <span>Revisado por {submission.reviewer_username}</span>
                        </Localized>
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default SubmissionCard; 