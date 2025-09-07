import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Use axiosInstance
import axiosInstance from '../../utils/axiosInstance';
// import axios from 'axios';
import {
    Container, Typography, Box, List, ListItem, ListItemText, Button, TextField,
    Grid, Paper, CircularProgress, Alert, IconButton, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Divider, Avatar,
    ListItemIcon, Select, MenuItem, InputLabel, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow // Added Table components
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // For title
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'; // Icon for removing attendee
import StarsIcon from '@mui/icons-material/Stars'; // Icon for bonus points
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for bonus points log
import { Localized } from '@fluent/react';
import { bonusSourceOptions } from '../../utils/bonusSourceOptions'; // Import from shared location
import AddBonusPointsDialog from './AddBonusPointsDialog'; // Import the new dialog component
import BonusPointsLogDialog from './BonusPointsLogDialog'; // Import the Bonus Points Log dialog
import EditChampionshipDialog from './EditChampionshipDialog'; // Import the Edit Championship Dialog
import DeleteChampionshipDialog from './DeleteChampionshipDialog'; // Import the Delete Championship Dialog
import EditRaceDialog from './EditRaceDialog'; // Import the Edit Race Dialog
import DeleteRaceDialog from './DeleteRaceDialog'; // Import the Delete Race Dialog
import RemoveAttendeeDialog from './RemoveAttendeeDialog'; // Import the Remove Attendee Dialog
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // React Query imports

// --- Expected Backend Endpoints --- 
// GET /api/championships - Returns [{ id, name, created_at }, ...]
// POST /api/championships - Expects { name: string }, Returns { id, name, created_at }
// GET /api/championships/:champId/races - Returns [{ id, title, date, championship_id }, ...]
// POST /api/championships/:champId/races - Expects { title: string, date: string }, Returns { id, title, date, championship_id }
// PUT /api/championships/:id - Expects { name: string }
// DELETE /api/championships/:id
// PUT /api/races/:id - Expects { title: string, date: string }
// DELETE /api/races/:id
// DELETE /api/championships/:champId/attendees/:userId
// GET /api/championship-attendees?championshipId=:champId - Returns [{ id, user_id, team_id, score, points, bonus_points }]
// POST /api/championship-attendees/:attendeeId/bonus-points - Expects { points: number, source: string, reason?: string }
// GET /api/championship-attendees/:attendeeId/bonus-points-log - Returns [{ id, points_awarded, source, reason, awarded_at }, ...]
// -------------------------------------

function ChampionshipManager() {
    const queryClient = useQueryClient();

    // const [championships, setChampionships] = useState([]); // Replaced by useQuery
    // const [races, setRaces] = useState([]); // Replaced by useQuery for races
    const [selectedChampionship, setSelectedChampionship] = useState(null);
    const [newChampionshipName, setNewChampionshipName] = useState('');
    const [newRaceTitle, setNewRaceTitle] = useState('');
    const [newRaceDate, setNewRaceDate] = useState('');
    // const [loadingRaces, setLoadingRaces] = useState(false); // Replaced by useQuery for races
    const [error, setError] = useState(null); 
    const [successMessage, setSuccessMessage] = useState(null); 

    // const [attendees, setAttendees] = useState([]); // Replaced by useQuery for attendees
    // const [loadingAttendees, setLoadingAttendees] = useState(false); // Replaced by useQuery for attendees
    const [attendeeToRemove, setAttendeeToRemove] = useState(null); 
    const [openRemoveAttendeeDialog, setOpenRemoveAttendeeDialog] = useState(false);
    const [isRemovingAttendee, setIsRemovingAttendee] = useState(false); // Will be useMutation isLoading
    // --- END NEW STATE ---

    // --- State for Bonus Points Modal ---
    const [openBonusPointsDialog, setOpenBonusPointsDialog] = useState(false);
    const [attendeeForBonus, setAttendeeForBonus] = useState(null); // { id (attendee_id), name (user's name for display), currentBonusPoints }
    // const [isAddingBonusPoints, setIsAddingBonusPoints] = useState(false); // Replaced by useMutation isLoading
    // --- End State for Bonus Points Modal ---

    // --- State for Bonus Points Log Modal ---
    const [openBonusLogDialog, setOpenBonusLogDialog] = useState(false);
    const [attendeeForLog, setAttendeeForLog] = useState(null); // { id (attendee_id), name (user's name) }
    // const [bonusLogEntries, setBonusLogEntries] = useState([]); // Moved to BonusPointsLogDialog
    // const [loadingBonusLog, setLoadingBonusLog] = useState(false); // Moved to BonusPointsLogDialog
    // --- End State for Bonus Points Log Modal ---

    // --- State for Modals ---
    const [openEditChampDialog, setOpenEditChampDialog] = useState(false);
    const [openDeleteChampDialog, setOpenDeleteChampDialog] = useState(false);
    const [champToEdit, setChampToEdit] = useState(null);
    const [champToDelete, setChampToDelete] = useState(null);
    // const [editedChampName, setEditedChampName] = useState(''); // Moved to EditChampionshipDialog
    // const [editedChampLsfRevealRaceId, setEditedChampLsfRevealRaceId] = useState(''); // Moved
    // const [racesForEditDialog, setRacesForEditDialog] = useState([]); // Moved
    // const [loadingRacesForEditDialog, setLoadingRacesForEditDialog] = useState(false); // Moved

    const [openEditRaceDialog, setOpenEditRaceDialog] = useState(false);
    const [openDeleteRaceDialog, setOpenDeleteRaceDialog] = useState(false);
    const [raceToEdit, setRaceToEdit] = useState(null);
    const [raceToDelete, setRaceToDelete] = useState(null);
    // const [editedRaceTitle, setEditedRaceTitle] = useState(''); // Moved to EditRaceDialog
    // const [editedRaceDate, setEditedRaceDate] = useState(''); // Moved to EditRaceDialog
    // --- End State for Modals ---

    // --- State for LSF Score Reveal Race ID in Edit Champ Dialog ---
    // const [editedChampLsfRevealRaceId, setEditedChampLsfRevealRaceId] = useState(''); // Empty string for 'Live Score' option
    // const [racesForEditDialog, setRacesForEditDialog] = useState([]);
    // const [loadingRacesForEditDialog, setLoadingRacesForEditDialog] = useState(false);
    // --- End LSF Score State ---

    // const [isCreatingChamp, setIsCreatingChamp] = useState(false); // Replaced by useMutation isLoading
    const [isCreatingRace, setIsCreatingRace] = useState(false); // Will be useMutation isLoading
    const [isEditingChamp, setIsEditingChamp] = useState(false); // Will be useMutation isLoading
    const [isDeletingChamp, setIsDeletingChamp] = useState(false); // Will be useMutation isLoading
    const [isEditingRace, setIsEditingRace] = useState(false); // Will be useMutation isLoading
    const [isDeletingRace, setIsDeletingRace] = useState(false); // Will be useMutation isLoading

    // --- React Query for fetching championships ---
    const { 
        data: championships = [], 
        isLoading: isLoadingChampionships, 
        error: championshipsError 
    } = useQuery({
        queryKey: ['championships'], 
        queryFn: async () => {
            const response = await axiosInstance.get('/api/championships?includeHidden=true&includeRegistering=true');
            return response.data;
        },
        onError: (err) => {
            console.error("Error fetching championships:", err);
            setError('fetch-championships-error'); 
        }
    }
    );

    // --- React Query for fetching users ---
    const { 
        data: users = [], 
        isLoading: isLoadingUsers, 
        error: usersError 
    } = useQuery({
        queryKey: ['users'], 
        queryFn: async () => {
            const response = await axiosInstance.get('/api/users');
            return response.data;
        },
        onError: (err) => {
            console.error("Error fetching users:", err);
            setError('fetch-users-error');
        }
    }
    );
    
    // --- React Query for fetching races for the selected championship ---
    const { 
        data: races = [], 
        isLoading: isLoadingRaces, 
        error: racesError 
    } = useQuery({
        queryKey: ['races', selectedChampionship?.id], // Query key includes selectedChampionship.id
        queryFn: async () => {
            if (!selectedChampionship?.id) return []; // Do not fetch if no championship is selected
            const response = await axiosInstance.get(`/api/championships/${selectedChampionship.id}/races`);
            return response.data;
        },
        enabled: !!selectedChampionship?.id, // Only run query if selectedChampionship.id exists
        onError: (err) => {
            console.error(`Error fetching races for championship ${selectedChampionship?.id}:`, err);
            setError('fetch-races-error'); 
        }
    }
    );

    // --- React Query for fetching attendees for the selected championship ---
    const { 
        data: attendees = [], 
        isLoading: isLoadingAttendees, 
        error: attendeesError 
    } = useQuery({
        queryKey: ['attendees', selectedChampionship?.id], // Query key
        queryFn: async () => {
            if (!selectedChampionship?.id) return [];
            const response = await axiosInstance.get(`/api/championship-attendees?championshipId=${selectedChampionship.id}`);
            return response.data;
        },
        enabled: !!selectedChampionship?.id,
        onError: (err) => {
            console.error(`Error fetching attendees for championship ${selectedChampionship?.id}:`, err);
            setError('fetch-attendees-error');
        }
    }
    );

    // useEffect(() => { // This manual fetching is now handled by React Query's dependent queries
    //     if (selectedChampionship) {
    //         fetchRaces(selectedChampionship.id);
    //         fetchAttendees(selectedChampionship.id);
    //     } else {
    //         setRaces([]); 
    //         setAttendees([]);
    //     }
    // }, [selectedChampionship]);

    // const fetchRaces = async (champId) => { ... }; // Replaced by useQuery
    // const fetchAttendees = async (champId) => { ... }; // Replaced by useQuery

    // --- React Query Mutation for creating a championship ---
    const createChampionshipMutation = useMutation({
        mutationFn: async (newChampName) => {
            const response = await axiosInstance.post('/api/championships', { name: newChampName });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['championships'] });
            setNewChampionshipName('');
            setSuccessMessage('create-championship-success');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        },
        onError: (err) => {
            console.error("Error creating championship:", err);
            setError(err.response?.data?.message || 'create-championship-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleCreateChampionship = async (e) => {
        e.preventDefault();
        if (!newChampionshipName) return;
        createChampionshipMutation.mutate(newChampionshipName);
    };

    // --- React Query Mutation for creating a race ---
    const createRaceMutation = useMutation({
        mutationFn: async (raceData) => { // raceData: { championshipId, title, date }
            const response = await axiosInstance.post(`/api/championships/${raceData.championshipId}/races`, {
                title: raceData.title,
                date: raceData.date
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['races', variables.championshipId] }); // Invalidate races for this champ
            setNewRaceTitle('');
            setNewRaceDate('');
            setSuccessMessage('create-race-success');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        },
        onError: (err) => {
            console.error("Error creating race:", err);
            setError(err.response?.data?.message || 'create-race-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleCreateRace = async (e) => {
        e.preventDefault();
        if (!selectedChampionship || !newRaceTitle || !newRaceDate) return;
        createRaceMutation.mutate({ 
            championshipId: selectedChampionship.id, 
            title: newRaceTitle, 
            date: newRaceDate 
        });
    };

    // --- Modal Open/Close Handlers ---
    const handleOpenEditChamp = useCallback((champ) => {
        setChampToEdit(champ);
        setOpenEditChampDialog(true);
    }, []);

    const handleCloseEditChamp = () => setOpenEditChampDialog(false);
    const handleOpenDeleteChamp = (champ) => {
        setChampToDelete(champ);
        setOpenDeleteChampDialog(true);
    };
    const handleCloseDeleteChamp = () => setOpenDeleteChampDialog(false);

    const handleOpenEditRace = (race) => {
        setRaceToEdit(race);
        setOpenEditRaceDialog(true);
    };
    const handleCloseEditRace = () => setOpenEditRaceDialog(false);
    const handleOpenDeleteRace = (race) => {
        setRaceToDelete(race);
        setOpenDeleteRaceDialog(true);
    };
    const handleCloseDeleteRace = () => setOpenDeleteRaceDialog(false);
    // --- End Modal Handlers ---
    
    // --- React Query Mutation for editing a championship ---
    const editChampionshipMutation = useMutation({
        mutationFn: async (champData) => { // champData: { id, name, lsf_score_reveal_race_id, status }
            const payload = {
                name: champData.name,
                lsf_score_reveal_race_id: champData.lsf_score_reveal_race_id,
                status: champData.status
            };
            const response = await axiosInstance.put(`/api/championships/${champData.id}`, payload);
            return response.data.championship; // Return the updated championship
        },
        onSuccess: (updatedChampData) => {
            queryClient.invalidateQueries({ queryKey: ['championships'] });
            handleCloseEditChamp();
            if (selectedChampionship?.id === updatedChampData.id) {
                setSelectedChampionship(updatedChampData);
            }
            setSuccessMessage('edit-championship-success');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        },
        onError: (err) => {
            console.error("Error editing champ:", err);
            setError(err.response?.data?.message || 'edit-championship-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleConfirmEditChamp = async (data) => { 
        if (!data || !data.name) return;
        editChampionshipMutation.mutate(data);
    };

    // --- React Query Mutation for deleting a championship ---
    const deleteChampionshipMutation = useMutation({
        mutationFn: async (champId) => {
            await axiosInstance.delete(`/api/championships/${champId}`);
            return champId; // Return id for onSuccess
        },
        onSuccess: (deletedChampId) => {
            queryClient.invalidateQueries({ queryKey: ['championships'] });
            // Also invalidate races and attendees if the deleted championship was selected
            if (selectedChampionship?.id === deletedChampId) {
                queryClient.invalidateQueries({ queryKey: ['races', deletedChampId] });
                queryClient.invalidateQueries({ queryKey: ['attendees', deletedChampId] });
                setSelectedChampionship(null);
            }
            handleCloseDeleteChamp();
            setSuccessMessage('delete-championship-success');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        },
        onError: (err) => {
            console.error("Error deleting champ:", err);
            setError(err.response?.data?.message || 'delete-championship-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleConfirmDeleteChamp = async () => { 
        if (!champToDelete) return;
        deleteChampionshipMutation.mutate(champToDelete.id);
    };

    // --- React Query Mutation for editing a race ---
    const editRaceMutation = useMutation({
        mutationFn: async (raceData) => { // raceData: { id, title, date, championshipId (for invalidation) }
            await axiosInstance.put(`/api/races/${raceData.id}`, { 
                title: raceData.title, 
                date: raceData.date 
            });
            return raceData; // Return full data for onSuccess
        },
        onSuccess: (updatedRaceData) => {
            queryClient.invalidateQueries({ queryKey: ['races', updatedRaceData.championshipId] });
            handleCloseEditRace();
            setSuccessMessage('edit-race-success'); 
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        },
        onError: (err) => {
            console.error("Error editing race:", err); 
            setError(err.response?.data?.message || 'edit-race-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleConfirmEditRace = async (data) => { 
        if (!data || !data.id || !data.title || !data.date || !selectedChampionship?.id) return;
        editRaceMutation.mutate({ ...data, championshipId: selectedChampionship.id });
    };

    // --- React Query Mutation for deleting a race ---
    const deleteRaceMutation = useMutation({
        mutationFn: async (raceData) => { // raceData: { raceId, championshipId }
            await axiosInstance.delete(`/api/races/${raceData.raceId}`);
            return raceData; // Pass championshipId for invalidation
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['races', data.championshipId] });
            handleCloseDeleteRace();
            setSuccessMessage('delete-race-success');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        },
        onError: (err) => {
            console.error("Error deleting race:", err); 
            setError(err.response?.data?.message || 'delete-race-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleConfirmDeleteRace = async () => { 
        if (!raceToDelete || !selectedChampionship?.id) return;
        deleteRaceMutation.mutate({ raceId: raceToDelete.id, championshipId: selectedChampionship.id });
    };

    // --- NEW ATTENDEE REMOVAL HANDLERS ---
    const handleOpenRemoveAttendee = (attendee) => {
        const user = users.find(u => u.id === attendee.user_id);
        setAttendeeToRemove({ 
            userId: attendee.user_id, 
            userName: user ? `${user.username} (${user.usertag})` : `User ID ${attendee.user_id}`
        });
        setOpenRemoveAttendeeDialog(true);
    };

    const handleCloseRemoveAttendee = () => {
        setOpenRemoveAttendeeDialog(false);
        setAttendeeToRemove(null);
    };

    // --- React Query Mutation for removing an attendee ---
    const removeAttendeeMutation = useMutation({
        mutationFn: async (attendeeData) => { // attendeeData: { userId, championshipId }
            await axiosInstance.delete(`/api/championships/${attendeeData.championshipId}/attendees/${attendeeData.userId}`);
            return attendeeData; // Pass championshipId for invalidation
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendees', data.championshipId] });
            handleCloseRemoveAttendee();
            setSuccessMessage('remove-attendee-success');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null);
        },
        onError: (err) => {
            console.error("Error removing attendee:", err);
            setError(err.response?.data?.message || 'remove-attendee-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleConfirmRemoveAttendee = async () => { 
        if (!attendeeToRemove || !selectedChampionship?.id) return;
        removeAttendeeMutation.mutate({ 
            userId: attendeeToRemove.userId, 
            championshipId: selectedChampionship.id 
        });
    };

    // --- Bonus Points Dialog Handlers ---
    const handleOpenBonusPointsDialog = (attendee) => {
        const user = userMap.get(attendee.user_id);
        setAttendeeForBonus({
            id: attendee.id, 
            name: user ? `${user.username} (${user.usertag})` : `User ID ${attendee.user_id}`,
            currentBonusPoints: attendee.bonus_points || 0
        });
        setOpenBonusPointsDialog(true);
    };

    const handleCloseBonusPointsDialog = () => {
        setOpenBonusPointsDialog(false);
        setAttendeeForBonus(null);
        // Clear mutation-specific error if dialog is closed
        if (addBonusPointsMutation.isError) {
            addBonusPointsMutation.reset(); 
        }
    };

    // --- React Query Mutation for adding bonus points ---
    const addBonusPointsMutation = useMutation({
        mutationFn: async (bonusData) => { // bonusData: { attendeeId, points, source, reason, championshipId }
            const response = await axiosInstance.post(`/api/championship-attendees/${bonusData.attendeeId}/bonus-points`, {
                points: bonusData.points,
                source: bonusData.source,
                reason: bonusData.reason,
            });
            return { ...response.data, championshipId: bonusData.championshipId }; // Pass championshipId for invalidation
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendees', data.championshipId] });
            handleCloseBonusPointsDialog();
            setSuccessMessage('add-bonus-points-success');
            setTimeout(() => setSuccessMessage(null), 3000);
            setError(null); // Clear general error on success
        },
        onError: (err) => {
            console.error("Error adding bonus points:", err);
            // Set a specific error for the dialog or use a general one
            setError(err.response?.data?.message || 'add-bonus-points-error');
            setSuccessMessage(null);
        }
    }
    );

    const handleSubmitBonusPoints = async (data) => { 
        if (!selectedChampionship?.id) {
            setError('No championship selected for bonus points.'); // Should not happen if UI is correct
            return;
        }
        addBonusPointsMutation.mutate({ ...data, championshipId: selectedChampionship.id });
    };
    // --- End Bonus Points Dialog Handlers ---

    // --- Bonus Points Log Dialog Handlers ---
    const handleOpenBonusLogDialog = (attendee) => {
        const user = userMap.get(attendee.user_id);
        setAttendeeForLog({
            id: attendee.id, 
            name: user ? `${user.username} (${user.usertag})` : `User ID ${attendee.user_id}`,
        });
        setOpenBonusLogDialog(true);
    };

    const handleCloseBonusLogDialog = () => {
        setOpenBonusLogDialog(false);
        setAttendeeForLog(null);
    };
    // --- End Bonus Points Log Dialog Handlers ---

    // Memoized map for quick user lookup
    const userMap = useMemo(() => {
        return new Map(users.map(user => [user.id, user]));
    }, [users]);

    // Combine general error with specific query errors for display if needed
    const displayError = error || championshipsError?.message || usersError?.message || racesError?.message || attendeesError?.message;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                    <EmojiEventsIcon />
                </Avatar>
                <Typography component="h1" variant="h4">
                    <Localized id="admin-championship-manager-title" />
                </Typography>
            </Box>
            {displayError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}><Localized id={typeof displayError === 'string' ? displayError : 'generic-error-fallback'} fallback={<Localized id='generic-error-fallback' />} /></Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}><Localized id={successMessage} fallback={successMessage} /></Alert>}

            <Grid container spacing={4}>
                {/* Championships Column */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom><Localized id="admin-championships-heading" /></Typography>
                        {isLoadingChampionships ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
                        ) : (
                            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {championships.map((champ, index) => (
                                    <React.Fragment key={champ.id}>
                                        <ListItem 
                                            button 
                                            selected={selectedChampionship?.id === champ.id} 
                                            onClick={() => setSelectedChampionship(champ)}
                                            secondaryAction={
                                                <>
                                                    <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); handleOpenEditChamp(champ); }} size="small">
                                                        <EditIcon fontSize="inherit"/>
                                                    </IconButton>
                                                    <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleOpenDeleteChamp(champ); }} size="small">
                                                        <DeleteIcon fontSize="inherit"/>
                                                    </IconButton>
                                                </>
                                            }
                                        >
                                            <ListItemText 
                                                primary={champ.name} 
                                                secondary={
                                                    <Localized id={`championship-status-${champ.status?.toLowerCase()}`} fallback={champ.status} />
                                                }
                                            />
                                        </ListItem>
                                        {index < championships.length - 1 && <Divider component="li" />} 
                                    </React.Fragment>
                                ))}
                                {championships.length === 0 && !isLoadingChampionships && (
                                    <ListItem><ListItemText primary={<Localized id="admin-no-championships" />} /></ListItem>
                                )}
                            </List>
                        )}
                    </Paper>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom><Localized id="admin-add-championship-subheading" /></Typography>
                        <Box component="form" onSubmit={handleCreateChampionship} sx={{ mt: 1 }}>
                            <TextField
                                label={<Localized id="admin-new-championship-label" />}
                                value={newChampionshipName}
                                onChange={(e) => setNewChampionshipName(e.target.value)}
                                fullWidth
                                required
                                size="small"
                                margin="dense"
                                disabled={createChampionshipMutation.isLoading}
                            />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                startIcon={createChampionshipMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                                sx={{ mt: 2 }}
                                disabled={createChampionshipMutation.isLoading || !newChampionshipName}
                                fullWidth
                            >
                                <Localized id="admin-create-championship-button" />
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Races & Attendees Column */}
                <Grid item xs={12} md={8}>
                    {/* --- Races Section --- */}
                    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            {selectedChampionship 
                                ? <Localized id="admin-races-heading" vars={{ champName: selectedChampionship.name }}/>
                                : <Localized id="admin-select-championship-prompt"/>
                            }
                        </Typography>
                        {selectedChampionship && isLoadingRaces && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
                        )}
                        {selectedChampionship && !isLoadingRaces && racesError && (
                            <Alert severity="error" sx={{ my: 2 }}><Localized id='fetch-races-error' fallback="Could not load races." /></Alert>
                        )}
                        {selectedChampionship && !isLoadingRaces && !racesError ? (
                            <Box>
                                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                                    {races.length === 0 ? (
                                        <ListItem><ListItemText primary={<Localized id="admin-no-races" />} /></ListItem>
                                    ) : (
                                        races.map((race, index) => (
                                            <React.Fragment key={race.id}>
                                                <ListItem 
                                                    secondaryAction={
                                                        <>
                                                            <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); handleOpenEditRace(race); }} size="small">
                                                                <EditIcon fontSize="inherit"/>
                                                            </IconButton>
                                                            <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleOpenDeleteRace(race); }} size="small">
                                                                <DeleteIcon fontSize="inherit"/>
                                                            </IconButton>
                                                        </>
                                                    }
                                                >
                                                    <ListItemText primary={race.title} secondary={<Localized id="admin-race-date-label" vars={{ raceDate: race.date ? new Date(race.date).toLocaleDateString() : '' }} />} />
                                                </ListItem>
                                                {index < races.length - 1 && <Divider component="li" />} 
                                            </React.Fragment>
                                        ))
                                    )}
                                </List>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" gutterBottom><Localized id="admin-add-race-subheading" /></Typography>
                                <Box component="form" onSubmit={handleCreateRace} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <TextField
                                        label={<Localized id="admin-new-race-title-label" />}
                                        value={newRaceTitle}
                                        onChange={(e) => setNewRaceTitle(e.target.value)}
                                        required size="small" sx={{ flexGrow: 1 }}
                                        disabled={createRaceMutation.isLoading}
                                    />
                                    <TextField
                                        label={<Localized id="admin-new-race-date-label" />}
                                        type="date"
                                        value={newRaceDate}
                                        onChange={(e) => setNewRaceDate(e.target.value)}
                                        required size="small"
                                        InputLabelProps={{ shrink: true }}
                                        disabled={createRaceMutation.isLoading}
                                    />
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        startIcon={createRaceMutation.isLoading ? <CircularProgress size={20} color="inherit"/> : <AddIcon />}
                                        disabled={createRaceMutation.isLoading || !newRaceTitle || !newRaceDate}
                                        sx={{ mt: 0.5 }}
                                    >
                                        <Localized id="admin-add-race-button" vars={{ champName: selectedChampionship?.name || ''}}/>
                                    </Button>
                                </Box>
                            </Box>
                        ) : !selectedChampionship ? (
                            <Typography variant="body2" color="text.secondary" sx={{mt: 2}}><Localized id="admin-select-championship-prompt" /></Typography> 
                        ) : null}
                    </Paper>
                    
                    {/* --- Attendees Section --- */} 
                    {selectedChampionship && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                <Localized id="admin-attendees-heading" />
                            </Typography>
                            {(isLoadingUsers || isLoadingAttendees) ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
                            ) : attendeesError ? (
                                <Alert severity="error" sx={{ my: 2 }}><Localized id='fetch-attendees-error' fallback="Could not load attendees." /></Alert>
                            ) : (
                                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                                    {attendees.length === 0 
                                        ? (<ListItem><ListItemText primary={<Localized id="admin-no-attendees" />} /></ListItem>) 
                                        : (attendees.map((attendee, index) => {
                                            const user = userMap.get(attendee.user_id);
                                            const isUnassigned = attendee.team_id === null;
                                            return (
                                                <React.Fragment key={attendee.id}>
                                                    <ListItem 
                                                        secondaryAction={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <IconButton 
                                                                    edge="end" 
                                                                    aria-label="add bonus points"
                                                                    onClick={() => handleOpenBonusPointsDialog(attendee)}
                                                                    size="small"
                                                                    color="primary" 
                                                                    title="Add Bonus/Penalty Points"
                                                                >
                                                                    <StarsIcon fontSize="inherit"/>
                                                                </IconButton>
                                                                <IconButton 
                                                                    edge="end" 
                                                                    aria-label="view bonus points log"
                                                                    onClick={() => handleOpenBonusLogDialog(attendee)}
                                                                    size="small"
                                                                    color="default"
                                                                    title="View Bonus Points Log"
                                                                >
                                                                    <ListAltIcon fontSize="inherit"/>
                                                                </IconButton>
                                                                <IconButton 
                                                                    edge="end" 
                                                                    aria-label="remove attendee" 
                                                                    onClick={() => handleOpenRemoveAttendee(attendee)}
                                                                    size="small"
                                                                    color="error"
                                                                    title="Remove Attendee"
                                                                >
                                                                    <PersonRemoveIcon fontSize="inherit"/>
                                                                </IconButton>
                                                            </Box>
                                                        }
                                                    >
                                                        <ListItemText 
                                                            primary={user ? `${user.username} (${user.usertag})` : `User ID ${attendee.user_id}`}
                                                            secondary={`#${user?.driver_number ?? 'N/A'} - Bonus: ${attendee.bonus_points || 0}${isUnassigned ? ' - Unassigned' : ''}`} 
                                                        />
                                                    </ListItem>
                                                    {index < attendees.length - 1 && <Divider component="li" />} 
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </List>
                            )}
                        </Paper>
                    )}

                </Grid>
            </Grid>

            {/* Edit Championship Dialog */}
            <EditChampionshipDialog 
                open={openEditChampDialog}
                onClose={handleCloseEditChamp}
                onSubmit={handleConfirmEditChamp}
                championshipData={champToEdit}
                isLoading={editChampionshipMutation.isLoading}
                parentError={error && (error === 'edit-championship-error' || error.startsWith('championship-name')) ? error : null}
            />

            <DeleteChampionshipDialog 
                open={openDeleteChampDialog}
                onClose={handleCloseDeleteChamp}
                onConfirm={handleConfirmDeleteChamp}
                championshipName={champToDelete?.name}
                isLoading={deleteChampionshipMutation.isLoading}
                parentError={error && error === 'delete-championship-error' ? error : null}
            />

            <EditRaceDialog 
                open={openEditRaceDialog}
                onClose={handleCloseEditRace}
                onSubmit={handleConfirmEditRace}
                raceData={raceToEdit}
                isLoading={editRaceMutation.isLoading}
                parentError={error && (error === 'edit-race-error' || error === 'race-title-date-required') ? error : null}
            />

            <DeleteRaceDialog 
                open={openDeleteRaceDialog}
                onClose={handleCloseDeleteRace}
                onConfirm={handleConfirmDeleteRace}
                raceTitle={raceToDelete?.title}
                isLoading={deleteRaceMutation.isLoading}
                parentError={error && error === 'delete-race-error' ? error : null}
            />

            {/* Remove Attendee Dialog - OLD JSX REMOVED */}
            <RemoveAttendeeDialog 
                open={openRemoveAttendeeDialog}
                onClose={handleCloseRemoveAttendee}
                onConfirm={handleConfirmRemoveAttendee}
                userName={attendeeToRemove?.userName}
                championshipName={selectedChampionship?.name}
                isLoading={removeAttendeeMutation.isLoading}
                parentError={error && error === 'remove-attendee-error' ? error : null}
            />

            {/* Add Bonus Points Dialog */}
            {attendeeForBonus && (
                <AddBonusPointsDialog 
                    open={openBonusPointsDialog}
                    onClose={handleCloseBonusPointsDialog}
                    onSubmit={handleSubmitBonusPoints}
                    attendeeData={attendeeForBonus} 
                    bonusSourceOptions={bonusSourceOptions}
                    isLoading={addBonusPointsMutation.isLoading}
                    initialError={addBonusPointsMutation.isError ? (addBonusPointsMutation.error?.response?.data?.message || 'add-bonus-points-error') : null}
                />
            )}

            {/* Bonus Points Log Dialog */}
            <BonusPointsLogDialog 
                open={openBonusLogDialog}
                onClose={handleCloseBonusLogDialog}
                attendeeData={attendeeForLog}
                bonusSourceOptions={bonusSourceOptions}
            />

        </Container>
    );
}

export default ChampionshipManager; 