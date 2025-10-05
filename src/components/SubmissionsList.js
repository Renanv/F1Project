import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Stack, Grid, Button } from '@mui/material';
import { Localized } from '@fluent/react';
import axiosInstance from '../utils/axiosInstance';
import SubmissionCard from './SubmissionCard';
import EmptyState from './EmptyState';

function SubmissionsList({ type, isAdmin, category = null }) {
    const [statusFilter, setStatusFilter] = useState(() => {
        if (type === 'CHANNEL') {
            // Channels are auto-approved, so default to showing them.
            return 'APPROVED';
        }
        // For videos, admins default to the moderation queue.
        // Non-admins will have the backend filter for them (approved + their own).
        return isAdmin ? 'PENDING' : 'ALL';
    });
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = { type, ...(isAdmin && statusFilter !== 'ALL' && { status: statusFilter }) };
                if (category) {
                    params.category = category;
                }
                const response = await axiosInstance.get('/api/community-submissions', { params });
                setSubmissions(response.data.data);
            } catch (err) {
                setError(err.message || 'Failed to load submissions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, [type, statusFilter, isAdmin, category]);

    const handleStatusUpdate = async (submissionId, newStatus) => {
        try {
            await axiosInstance.put(`/api/community-submissions/${submissionId}/status`, { status: newStatus });
            // Refresh the list to show the updated status
            setSubmissions(prev => 
                prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s)
            );
        } catch (err) {
            console.error("Failed to update submission status", err);
            // Optionally set an error message to display to the user
        }
    };

    const handleFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setStatusFilter(newFilter);
        }
    };


    return (
        <Box sx={{ mt: 2 }}>
            {isAdmin && type === 'VIDEO' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <ToggleButtonGroup
                        color="primary"
                        value={statusFilter}
                        exclusive
                        onChange={handleFilterChange}
                        aria-label="Status filter"
                    >
                        <ToggleButton value="ALL"><Localized id="filter-all" /></ToggleButton>
                        <ToggleButton value="PENDING"><Localized id="filter-pending" /></ToggleButton>
                        <ToggleButton value="APPROVED"><Localized id="filter-approved" /></ToggleButton>
                        <ToggleButton value="REJECTED"><Localized id="filter-rejected" /></ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : submissions.length > 0 ? (
                <Grid container spacing={2}>
                    {submissions.map((submission) => (
                        <Grid item xs={12} sm={6} md={4} key={submission.id}>
                            <SubmissionCard 
                                submission={submission} 
                                onStatusChange={handleStatusUpdate} 
                                isAdmin={isAdmin}
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <EmptyState
                  titleId="community-page-title"
                  messageId="no-submissions-found"
                  actionLabelId="submission-submit-button"
                  onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                />
            )}
        </Box>
    );
}

export default SubmissionsList; 