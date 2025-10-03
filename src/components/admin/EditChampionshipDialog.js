import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert
} from '@mui/material';
import { Localized } from '@fluent/react';
import axiosInstance from '../../utils/axiosInstance';

function EditChampionshipDialog({
    open,
    onClose,
    onSubmit,
    championshipData, // { id, name, lsf_score_reveal_race_id, status, registration_form_link }
    isLoading, // Parent loading state for submission
    // Pass a general error from parent if API call in parent fails
    // Or let dialog handle its own errors for race fetching, parent for submission error
    parentError 
}) {
    const [editedName, setEditedName] = useState('');
    const [editedLsfRevealRaceId, setEditedLsfRevealRaceId] = useState('');
    const [editedStatus, setEditedStatus] = useState('');
    const [editedRegistrationFormLink, setEditedRegistrationFormLink] = useState('');
    const [editedConstructorsMode, setEditedConstructorsMode] = useState('individual');
    const [editedLiveryOrder, setEditedLiveryOrder] = useState('normal');
    const [racesForDropdown, setRacesForDropdown] = useState([]);
    const [loadingRaces, setLoadingRaces] = useState(false);
    const [dialogError, setDialogError] = useState(null);

    useEffect(() => {
        if (open && championshipData) {
            setEditedName(championshipData.name || '');
            setEditedLsfRevealRaceId(championshipData.lsf_score_reveal_race_id === null || championshipData.lsf_score_reveal_race_id === undefined 
                ? '' 
                : String(championshipData.lsf_score_reveal_race_id));
            setEditedStatus(championshipData.status || 'REGISTERING');
            setEditedRegistrationFormLink(championshipData.registration_form_link || '');
            setEditedConstructorsMode(championshipData.constructors_ranking_mode || 'individual');
            setEditedLiveryOrder(championshipData.constructors_livery_order || 'normal');
            setDialogError(null); // Clear previous dialog-specific errors
            
            // Fetch races for this specific championship
            if (championshipData.id) {
                setLoadingRaces(true);
                axiosInstance.get(`/api/championships/${championshipData.id}/races`)
                    .then(response => {
                        setRacesForDropdown(response.data || []);
                    })
                    .catch(err => {
                        console.error(`Error fetching races for champ ${championshipData.id} in edit dialog:`, err);
                        setRacesForDropdown([]);
                        setDialogError(err.response?.data?.message || 'fetch-races-error'); // Error specific to fetching races for dialog
                    })
                    .finally(() => {
                        setLoadingRaces(false);
                    });
            }
        } else if (!open) {
            // Reset when dialog closes
            setEditedName('');
            setEditedLsfRevealRaceId('');
            setEditedStatus('');
            setEditedRegistrationFormLink('');
            setEditedConstructorsMode('individual');
            setEditedLiveryOrder('normal');
            setRacesForDropdown([]);
            setDialogError(null);
        }
    }, [open, championshipData]);

    const handleSubmit = () => {
        setDialogError(null); // Clear local errors before submitting
        if (!editedName.trim()) {
            setDialogError('championship-name-required'); // Example local validation
            return;
        }
        
        const submitData = {
            id: championshipData.id,
            name: editedName,
            lsf_score_reveal_race_id: editedLsfRevealRaceId === '' ? null : parseInt(editedLsfRevealRaceId, 10),
            status: editedStatus,
            registration_form_link: editedRegistrationFormLink === '' ? null : editedRegistrationFormLink,
            constructors_ranking_mode: editedConstructorsMode,
            constructors_livery_order: editedLiveryOrder
        };
        
        onSubmit(submitData);
    };

    // Use parentError if provided (e.g., for submission failure), otherwise use dialogError
    const currentError = parentError || dialogError;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle><Localized id="admin-edit-championship-title" /></DialogTitle>
            <DialogContent>
                {currentError && (
                    <Alert severity="error" onClose={() => setDialogError(null)} sx={{ mb: 2}}>
                        <Localized id={currentError} fallback={<Localized id='generic-error-fallback' />} />
                    </Alert>
                )}
                <TextField
                    autoFocus margin="dense" id="name"
                    label={<Localized id="admin-new-championship-label" />}
                    type="text" fullWidth variant="standard"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <FormControl fullWidth margin="normal" disabled={isLoading}>
                    <InputLabel id="status-label">
                        <Localized id="championship-status-label" />
                    </InputLabel>
                    <Select
                        labelId="status-label"
                        value={editedStatus}
                        label={<Localized id="championship-status-label" />}
                        onChange={(e) => setEditedStatus(e.target.value)}
                    >
                        <MenuItem value="REGISTERING">
                            <Localized id="championship-status-registering" />
                        </MenuItem>
                        <MenuItem value="RUNNING">
                            <Localized id="championship-status-running" />
                        </MenuItem>
                        <MenuItem value="FINISHED">
                            <Localized id="championship-status-finished" />
                        </MenuItem>
                        <MenuItem value="HIDDEN">
                            <Localized id="championship-status-hidden" />
                        </MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal" disabled={loadingRaces || isLoading}>
                    <InputLabel id="lsf-reveal-race-label">
                        <Localized id="admin-lsf-score-reveal-race-label" />
                    </InputLabel>
                    <Select
                        labelId="lsf-reveal-race-label"
                        value={editedLsfRevealRaceId}
                        label={<Localized id="admin-lsf-score-reveal-race-label" />}
                        onChange={(e) => setEditedLsfRevealRaceId(e.target.value)}
                    >
                        <MenuItem value=""> 
                            <Localized id="admin-lsf-score-reveal-race-live-option" />
                        </MenuItem>
                        {racesForDropdown.map((race) => (
                            <MenuItem key={race.id} value={String(race.id)}>
                                {race.title} ({race.date ? new Date(race.date).toLocaleDateString() : 'N/A'})
                            </MenuItem>
                        ))}
                        {loadingRaces &&
                            <MenuItem value={editedLsfRevealRaceId} disabled>
                                <em><Localized id="loading-races-message" fallback="Loading races..." /></em>
                            </MenuItem>
                        }
                    </Select>
                </FormControl>
                <TextField
                    margin="normal"
                    id="registration-form-link"
                    label={<Localized id="admin-registration-form-link-label" />}
                    type="url"
                    fullWidth
                    variant="standard"
                    value={editedRegistrationFormLink}
                    onChange={(e) => setEditedRegistrationFormLink(e.target.value)}
                    disabled={isLoading}
                    placeholder="https://forms.google.com/..."
                    helperText={<Localized id="admin-registration-form-link-helper" />}
                />
                <FormControl fullWidth margin="normal" disabled={isLoading}>
                    <InputLabel id="constructors-mode-label">
                        <Localized id="constructors-ranking-mode-label" />
                    </InputLabel>
                    <Select
                        labelId="constructors-mode-label"
                        value={editedConstructorsMode}
                        label={<Localized id="constructors-ranking-mode-label" />}
                        onChange={(e) => setEditedConstructorsMode(e.target.value)}
                    >
                        <MenuItem value="individual">
                            <Localized id="constructors-mode-individual" />
                        </MenuItem>
                        <MenuItem value="team_average">
                            <Localized id="constructors-mode-team-average" />
                        </MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal" disabled={isLoading}>
                    <InputLabel id="livery-order-label">
                        <Localized id="constructors-livery-order-label" />
                    </InputLabel>
                    <Select
                        labelId="livery-order-label"
                        value={editedLiveryOrder}
                        label={<Localized id="constructors-livery-order-label" />}
                        onChange={(e) => setEditedLiveryOrder(e.target.value)}
                    >
                        <MenuItem value="normal">
                            <Localized id="livery-order-normal" />
                        </MenuItem>
                        <MenuItem value="reverse">
                            <Localized id="livery-order-reverse" />
                        </MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={isLoading}><Localized id="admin-cancel-button" /></Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isLoading || loadingRaces || !editedName.trim()}>
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : <Localized id="admin-save-button" />}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditChampionshipDialog; 