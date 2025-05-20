import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Alert
} from '@mui/material';
import { Localized } from '@fluent/react';

function EditRaceDialog({
    open,
    onClose,
    onSubmit,
    raceData, // { id, title, date }
    isLoading,
    parentError
}) {
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDate, setEditedDate] = useState('');
    const [dialogError, setDialogError] = useState(null);

    useEffect(() => {
        if (open && raceData) {
            setEditedTitle(raceData.title || '');
            setEditedDate(raceData.date ? new Date(raceData.date).toISOString().split('T')[0] : '');
            setDialogError(null);
        } else if (!open) {
            setEditedTitle('');
            setEditedDate('');
            setDialogError(null);
        }
    }, [open, raceData]);

    const handleSubmit = () => {
        setDialogError(null);
        if (!editedTitle.trim() || !editedDate) {
            setDialogError('race-title-date-required'); // Example local validation
            return;
        }
        onSubmit({
            id: raceData.id,
            title: editedTitle,
            date: editedDate
        });
    };

    const currentError = parentError || dialogError;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle><Localized id="admin-edit-race-title" /></DialogTitle>
            <DialogContent>
                {currentError && (
                    <Alert severity="error" onClose={() => setDialogError(null)} sx={{ mb: 2}}>
                        <Localized id={currentError} fallback={<Localized id='generic-error-fallback' />} />
                    </Alert>
                )}
                <TextField
                    autoFocus margin="dense" id="race-title"
                    label={<Localized id="admin-new-race-title-label" />}
                    type="text" fullWidth variant="standard"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <TextField
                    margin="dense" id="race-date"
                    label={<Localized id="admin-new-race-date-label" />}
                    type="date" fullWidth variant="standard"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={isLoading}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={isLoading}><Localized id="admin-cancel-button" /></Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isLoading || !editedTitle.trim() || !editedDate}>
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : <Localized id="admin-save-button" />}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditRaceDialog; 