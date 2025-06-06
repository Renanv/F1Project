import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress, Alert
} from '@mui/material';
import { Localized } from '@fluent/react';

function RemoveAttendeeDialog({
    open,
    onClose,
    onConfirm,
    userName,
    championshipName,
    isLoading,
    parentError
}) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle><Localized id="admin-remove-attendee-title" /></DialogTitle>
            <DialogContent>
                {parentError && (
                    <Alert severity="error" sx={{ mb: 2}}>
                        <Localized id={parentError} fallback={<Localized id='generic-error-fallback' />} />
                    </Alert>
                )}
                <DialogContentText>
                    <Localized id="admin-remove-attendee-confirm" vars={{ userName: userName || '', champName: championshipName || '' }} />
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={isLoading}><Localized id="admin-cancel-button" /></Button>
                <Button onClick={onConfirm} color="error" variant="contained" disabled={isLoading}>
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : <Localized id="admin-remove-button" />}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default RemoveAttendeeDialog; 