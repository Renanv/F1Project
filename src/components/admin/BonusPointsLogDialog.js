import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material';
import { Localized } from '@fluent/react';
import axiosInstance from '../../utils/axiosInstance'; // Assuming axiosInstance is used for API calls

function BonusPointsLogDialog({ 
    open, 
    onClose, 
    attendeeData, // { id (attendee_id), name (user's name) }
    bonusSourceOptions // For displaying source labels
}) {
    const [logEntries, setLogEntries] = useState([]);
    const [loadingLog, setLoadingLog] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open && attendeeData?.id) {
            setLoadingLog(true);
            setError(null);
            setLogEntries([]); // Clear previous entries
            axiosInstance.get(`/api/championship-attendees/${attendeeData.id}/bonus-points-log`)
                .then(response => {
                    setLogEntries(response.data);
                })
                .catch(err => {
                    console.error("Error fetching bonus points log:", err);
                    setError(err.response?.data?.message || 'fetch-bonus-log-error');
                })
                .finally(() => {
                    setLoadingLog(false);
                });
        } else if (!open) {
            // Clear state when dialog is closed
            setLogEntries([]);
            setError(null);
            setLoadingLog(false);
        }
    }, [open, attendeeData]);

    if (!attendeeData) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Localized
                    id="admin-bonus-points-log-title"
                    vars={{ userName: attendeeData.name }}
                    fallback={`Bonus Points Log for ${attendeeData.name}`}
                />
            </DialogTitle>
            <DialogContent>
                {loadingLog ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
                ) : error ? (
                    <Alert severity="error" onClose={() => setError(null)}>
                        <Localized id={error} fallback={<Localized id='generic-error-fallback' />} />
                    </Alert>
                ) : logEntries.length === 0 ? (
                    <Typography><Localized id="admin-no-bonus-log-entries" fallback="No bonus point entries found for this attendee." /></Typography>
                ) : (
                    <Paper sx={{ mt: 1, maxHeight: '400px', overflow: 'auto' }}>
                        <TableContainer component={Paper} sx={{ mt: 1}}>
                            <Table stickyHeader size="small" aria-label="user bonus points log table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><Localized id="bonus-log-points-header" fallback="Points" /></TableCell>
                                        <TableCell><Localized id="bonus-log-source-header" fallback="Source" /></TableCell>
                                        <TableCell><Localized id="bonus-log-reason-header" fallback="Reason" /></TableCell>
                                        <TableCell><Localized id="bonus-log-awarded-at-header" fallback="Date Awarded" /></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logEntries.map((entry) => (
                                        <TableRow hover key={entry.id}>
                                            <TableCell>{entry.points_awarded}</TableCell>
                                            <TableCell>
                                                <Localized
                                                    id={`bonus-source-${entry.source}`}
                                                    fallback={bonusSourceOptions.find(opt => opt.value === entry.source)?.label || entry.source.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
                                                />
                                            </TableCell>
                                            <TableCell>{entry.reason || '-'}</TableCell>
                                            <TableCell>{new Date(entry.awarded_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>
                    <Localized id="admin-close-button" fallback="Close" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default BonusPointsLogDialog; 