import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Localized } from '@fluent/react';
import axiosInstance from '../utils/axiosInstance';
import SubmissionCard from './SubmissionCard';

function SubmissionsList({ type, isAdmin }) {
    const [statusFilter, setStatusFilter] = useState(isAdmin ? 'PENDING' : 'ALL');
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = { type, ...(statusFilter !== 'ALL' && { status: statusFilter }) };
                const response = await axiosInstance.get('/api/community-submissions', { params });
                setSubmissions(response.data.data);
            } catch (err) {
                setError(err.message || 'Failed to load submissions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, [type, statusFilter]);

    const handleStatusChange = async (submissionId, newStatus) => {
        try {
            await axiosInstance.put(`/api/community-submissions/${submissionId}/status`, { status: newStatus });
            // Refresh the list
            const params = { type, ...(statusFilter !== 'ALL' && { status: statusFilter }) };
            const response = await axiosInstance.get('/api/community-submissions', { params });
            setSubmissions(response.data.data);
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

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }

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

            {submissions && submissions.length > 0 ? (
                submissions.map(submission => (
                    <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        onStatusChange={handleStatusChange}
                        isAdmin={isAdmin}
                    />
                ))
            ) : (
                <Typography sx={{ textAlign: 'center', my: 4 }} color="text.secondary">
                    <Localized id="community-no-submissions" />
                </Typography>
            )}
        </Box>
    );
}

export default SubmissionsList; 