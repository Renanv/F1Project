import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert
} from '@mui/material';
import { Localized } from '@fluent/react';
// bonusSourceOptions will be passed as a prop now

function AddBonusPointsDialog({
    open,
    onClose,
    onSubmit,
    attendeeData, // { id, name, currentBonusPoints }
    bonusSourceOptions,
    isLoading,
    initialError // Prop to pass an initial error message if needed
}) {
    const [bonusAmount, setBonusAmount] = useState('');
    const [bonusSource, setBonusSource] = useState('');
    const [bonusReason, setBonusReason] = useState('');
    const [error, setError] = useState(initialError || null);

    // Reset form and error when dialog opens or attendeeData changes
    useEffect(() => {
        if (open) {
            setBonusAmount('');
            setBonusSource('');
            setBonusReason('');
            setError(initialError || null); // Reset error or set initial error
        } else {
            setError(null); // Clear error when dialog is closed
        }
    }, [open, attendeeData, initialError]);

    const handleSubmit = () => {
        setError(null); // Clear previous errors
        if (!attendeeData || !bonusAmount || !bonusSource) {
            setError('bonus-points-missing-fields');
            return;
        }
        const pointsNum = parseInt(bonusAmount, 10);
        if (isNaN(pointsNum)) {
            setError('bonus-points-invalid-amount');
            return;
        }
        onSubmit({ // Pass data to the parent handler
            points: pointsNum,
            source: bonusSource,
            reason: bonusReason,
            attendeeId: attendeeData.id
        });
    };

    if (!attendeeData) return null; // Or some placeholder if the dialog is open without data

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Localized
                    id="admin-add-bonus-points-title"
                    vars={{ userName: attendeeData.name }}
                    fallback={`Add Bonus/Penalty Points for ${attendeeData.name}`}
                />
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2}}>
                        <Localized id={error} fallback={<Localized id='generic-error-fallback' />} />
                    </Alert>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    id="bonus-amount"
                    label={<Localized id="admin-bonus-points-amount-label" fallback="Points Amount (can be negative)" />}
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={isLoading}
                />
                <FormControl fullWidth margin="dense" variant="outlined" sx={{ mb: 2 }} disabled={isLoading}>
                    <InputLabel id="bonus-source-label-id"><Localized id="admin-bonus-points-source-label" fallback="Source" /></InputLabel>
                    <Select
                        labelId="bonus-source-label-id"
                        id="bonus-source"
                        value={bonusSource}
                        onChange={(e) => setBonusSource(e.target.value)}
                        label={<Localized id="admin-bonus-points-source-label" fallback="Source" />}
                    >
                        {bonusSourceOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                <Localized id={`bonus-source-${option.value}`} fallback={option.label} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    margin="dense"
                    id="bonus-reason"
                    label={<Localized id="admin-bonus-points-reason-label" fallback="Reason (Optional)" />}
                    type="text"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    disabled={isLoading}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={isLoading}>
                    <Localized id="admin-cancel-button" />
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isLoading || !bonusAmount || !bonusSource}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    <Localized id="admin-submit-bonus-points-button" fallback="Submit Points" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddBonusPointsDialog; 