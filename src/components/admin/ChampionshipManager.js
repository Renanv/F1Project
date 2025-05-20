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
  const [championships, setChampionships] = useState([]);
  const [races, setRaces] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState(null);
  const [newChampionshipName, setNewChampionshipName] = useState('');
  const [newRaceTitle, setNewRaceTitle] = useState('');
  const [newRaceDate, setNewRaceDate] = useState(''); // Store date as string YYYY-MM-DD
  const [loadingChampionships, setLoadingChampionships] = useState(false);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null); // For success messages

  // --- NEW STATE FOR ATTENDEES/USERS ---
  const [attendees, setAttendees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [attendeeToRemove, setAttendeeToRemove] = useState(null); // { userId, userName }
  const [openRemoveAttendeeDialog, setOpenRemoveAttendeeDialog] = useState(false);
  const [isRemovingAttendee, setIsRemovingAttendee] = useState(false);
  // --- END NEW STATE ---

  // --- State for Bonus Points Modal ---
  const [openBonusPointsDialog, setOpenBonusPointsDialog] = useState(false);
  const [attendeeForBonus, setAttendeeForBonus] = useState(null); // { id (attendee_id), name (user's name for display), currentBonusPoints }
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusSource, setBonusSource] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [isAddingBonusPoints, setIsAddingBonusPoints] = useState(false);
  const bonusSourceOptions = [
    { value: 'MANUAL_ADJUSTMENT', label: 'Manual Admin Adjustment' },
    { value: 'CLASH', label: 'Clash' },
    { value: 'FASTEST_LAP', label: 'Fastest Lap' },
    { value: 'DRIVER_OF_THE_DAY', label: 'Driver of the Day' },
    { value: 'RACE_INCIDENT_PENALTY', label: 'Race Incident Penalty' },
    { value: 'BEAUTIFUL_PLAY', label: 'Beautiful Play' },
    { value: 'OTHER', label: 'Other (Specify in Reason)' },
  ];
  // --- End State for Bonus Points Modal ---

  // --- State for Bonus Points Log Modal ---
  const [openBonusLogDialog, setOpenBonusLogDialog] = useState(false);
  const [attendeeForLog, setAttendeeForLog] = useState(null); // { id (attendee_id), name (user's name) }
  const [bonusLogEntries, setBonusLogEntries] = useState([]);
  const [loadingBonusLog, setLoadingBonusLog] = useState(false);
  // --- End State for Bonus Points Log Modal ---

  // --- State for Modals ---
  const [openEditChampDialog, setOpenEditChampDialog] = useState(false);
  const [openDeleteChampDialog, setOpenDeleteChampDialog] = useState(false);
  const [champToEdit, setChampToEdit] = useState(null);
  const [champToDelete, setChampToDelete] = useState(null);
  const [editedChampName, setEditedChampName] = useState('');

  const [openEditRaceDialog, setOpenEditRaceDialog] = useState(false);
  const [openDeleteRaceDialog, setOpenDeleteRaceDialog] = useState(false);
  const [raceToEdit, setRaceToEdit] = useState(null);
  const [raceToDelete, setRaceToDelete] = useState(null);
  const [editedRaceTitle, setEditedRaceTitle] = useState('');
  const [editedRaceDate, setEditedRaceDate] = useState('');
  // --- End State for Modals ---

  // --- State for LSF Score Reveal Race ID in Edit Champ Dialog ---
  const [editedChampLsfRevealRaceId, setEditedChampLsfRevealRaceId] = useState(''); // Empty string for 'Live Score' option
  const [racesForEditDialog, setRacesForEditDialog] = useState([]);
  const [loadingRacesForEditDialog, setLoadingRacesForEditDialog] = useState(false);
  // --- End LSF Score State ---

  const [isCreatingChamp, setIsCreatingChamp] = useState(false);
  const [isCreatingRace, setIsCreatingRace] = useState(false);
  const [isEditingChamp, setIsEditingChamp] = useState(false);
  const [isDeletingChamp, setIsDeletingChamp] = useState(false);
  const [isEditingRace, setIsEditingRace] = useState(false);
  const [isDeletingRace, setIsDeletingRace] = useState(false);

  // Fetch championships on mount
  useEffect(() => {
    fetchChampionships();
    fetchUsers(); // Fetch all users once on mount
  }, []);

  // Fetch races and attendees when a championship is selected
  useEffect(() => {
    if (selectedChampionship) {
      fetchRaces(selectedChampionship.id);
      fetchAttendees(selectedChampionship.id);
    } else {
      setRaces([]); 
      setAttendees([]); // Clear attendees too
    }
  }, [selectedChampionship]);

  const fetchChampionships = async () => {
    setLoadingChampionships(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/api/championships');
      setChampionships(response.data);
    } catch (err) {
      console.error("Error fetching championships:", err);
      setError('fetch-championships-error'); // Use localized ID
    } finally {
      setLoadingChampionships(false);
    }
  };

  const fetchRaces = async (champId) => {
    setLoadingRaces(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/api/championships/${champId}/races`);
      setRaces(response.data);
    } catch (err) {
      console.error(`Error fetching races for championship ${champId}:`, err);
      setError('fetch-races-error'); // Use localized ID
    } finally {
      setLoadingRaces(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true); setError(null);
    try { const res = await axiosInstance.get('/api/users'); setUsers(res.data); }
    catch (err) { console.error("Error fetching users:", err); setError('fetch-users-error'); }
    finally { setLoadingUsers(false); }
  };

   const fetchAttendees = async (champId) => {
    setLoadingAttendees(true); setError(null);
    try { 
      const res = await axiosInstance.get(`/api/championship-attendees?championshipId=${champId}`); 
      setAttendees(res.data); 
    }
    catch (err) { console.error("Error fetching attendees:", err); setError('fetch-attendees-error'); }
    finally { setLoadingAttendees(false); }
  };

  const handleCreateChampionship = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newChampionshipName) return;
    setIsCreatingChamp(true);
    try {
      const response = await axiosInstance.post('/api/championships', { name: newChampionshipName });
      // Optimistically update championships state
      setChampionships(prevChamps => [...prevChamps, response.data]);
      setNewChampionshipName('');
    } catch (err) {
      console.error("Error creating championship:", err);
      setError(err.response?.data?.message || 'create-championship-error');
    } finally {
      setIsCreatingChamp(false);
    }
  };

  const handleCreateRace = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedChampionship || !newRaceTitle || !newRaceDate) return;
    setIsCreatingRace(true);
    try {
      const response = await axiosInstance.post(`/api/championships/${selectedChampionship.id}/races`, {
        title: newRaceTitle,
        date: newRaceDate
      });
      // Optimistically update races state
      setRaces(prevRaces => [...prevRaces, response.data]);
      setNewRaceTitle('');
      setNewRaceDate('');
    } catch (err) {
      console.error("Error creating race:", err);
      setError(err.response?.data?.message || 'create-race-error');
    } finally {
      setIsCreatingRace(false);
    }
  };

  // --- Modal Open/Close Handlers ---
  const handleOpenEditChamp = useCallback(async (champ) => {
      setChampToEdit(champ);
      setEditedChampName(champ.name);
      setEditedChampLsfRevealRaceId(champ.lsf_score_reveal_race_id === null || champ.lsf_score_reveal_race_id === undefined ? '' : champ.lsf_score_reveal_race_id);
      setOpenEditChampDialog(true);
      // Fetch races for this specific championship to populate the dropdown
      if (champ && champ.id) {
          setLoadingRacesForEditDialog(true);
          try {
              const response = await axiosInstance.get(`/api/championships/${champ.id}/races`);
              setRacesForEditDialog(response.data || []);
          } catch (err) {
              console.error(`Error fetching races for champ ${champ.id} in edit dialog:`, err);
              setRacesForEditDialog([]); // Clear or set error state
              // Optionally, set an error message specific to this fetch for the dialog
          } finally {
              setLoadingRacesForEditDialog(false);
          }
      }
  }, []);

  const handleCloseEditChamp = () => setOpenEditChampDialog(false);
  const handleOpenDeleteChamp = (champ) => {
      setChampToDelete(champ);
      setOpenDeleteChampDialog(true);
  };
  const handleCloseDeleteChamp = () => setOpenDeleteChampDialog(false);

  const handleOpenEditRace = (race) => {
      setRaceToEdit(race);
      setEditedRaceTitle(race.title);
      setEditedRaceDate(race.date ? new Date(race.date).toISOString().split('T')[0] : '');
      setOpenEditRaceDialog(true);
  };
  const handleCloseEditRace = () => setOpenEditRaceDialog(false);
  const handleOpenDeleteRace = (race) => {
      setRaceToDelete(race);
      setOpenDeleteRaceDialog(true);
  };
  const handleCloseDeleteRace = () => setOpenDeleteRaceDialog(false);
  // --- End Modal Handlers ---
  
  // --- API Call Handlers (Add loading states) ---
  const handleConfirmEditChamp = async () => {
      if (!champToEdit || !editedChampName) return;
      setError(null);
      setIsEditingChamp(true);
      try {
          const payload = {
            name: editedChampName,
            lsf_score_reveal_race_id: editedChampLsfRevealRaceId === '' ? null : parseInt(editedChampLsfRevealRaceId, 10)
          };
          const response = await axiosInstance.put(`/api/championships/${champToEdit.id}`, payload);
          const updatedChampData = response.data.championship; // Backend returns the updated championship object

          // Optimistically update championships state
          setChampionships(prevChamps => 
            prevChamps.map(champ => 
              champ.id === updatedChampData.id 
                ? updatedChampData // Use the full updated object from backend
                : champ
            )
          );
          handleCloseEditChamp();
          if (selectedChampionship?.id === updatedChampData.id) {
              setSelectedChampionship(updatedChampData); // Update selectedChampionship if it was the one edited
          }
      } catch (err) { 
          console.error("Error editing champ:", err); 
          setError(err.response?.data?.message || 'edit-championship-error'); // Localized ID
      } finally {
          setIsEditingChamp(false);
      }
  };

  const handleConfirmDeleteChamp = async () => {
      if (!champToDelete) return;
      setError(null);
      setIsDeletingChamp(true);
      try {
          await axiosInstance.delete(`/api/championships/${champToDelete.id}`);
          // Optimistically update championships state
          setChampionships(prevChamps => prevChamps.filter(champ => champ.id !== champToDelete.id));
          handleCloseDeleteChamp();
          if (selectedChampionship?.id === champToDelete.id) {
              setSelectedChampionship(null);
          }
      } catch (err) { 
          console.error("Error deleting champ:", err); 
          setError(err.response?.data?.message || 'delete-championship-error'); // Localized ID
          // Revert optimistic update on error
          fetchChampionships();
      } finally {
          setIsDeletingChamp(false);
      }
  };

  const handleConfirmEditRace = async () => {
      if (!raceToEdit || !editedRaceTitle || !editedRaceDate) return;
      setError(null);
      setIsEditingRace(true);
      try {
          await axiosInstance.put(`/api/races/${raceToEdit.id}`, { 
            title: editedRaceTitle, 
            date: editedRaceDate 
          });
          // Optimistically update races state
          setRaces(prevRaces => 
            prevRaces.map(race => 
              race.id === raceToEdit.id 
                ? { ...race, title: editedRaceTitle, date: editedRaceDate }
                : race
            )
          );
          handleCloseEditRace();
      } catch (err) { 
          console.error("Error editing race:", err); 
          setError(err.response?.data?.message || 'edit-race-error'); // Localized ID
      } finally {
          setIsEditingRace(false);
      }
  };

  const handleConfirmDeleteRace = async () => {
      if (!raceToDelete) return;
      setError(null);
      setIsDeletingRace(true);
      try {
          await axiosInstance.delete(`/api/races/${raceToDelete.id}`);
          // Optimistically update races state
          setRaces(prevRaces => prevRaces.filter(race => race.id !== raceToDelete.id));
          handleCloseDeleteRace();
      } catch (err) { 
          console.error("Error deleting race:", err); 
          setError(err.response?.data?.message || 'delete-race-error'); // Localized ID
          // Revert optimistic update on error
          fetchRaces(selectedChampionship.id);
      } finally {
          setIsDeletingRace(false);
      }
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

  const handleConfirmRemoveAttendee = async () => {
    if (!attendeeToRemove || !selectedChampionship) return;
    setError(null);
    setIsRemovingAttendee(true);
    try {
      await axiosInstance.delete(`/api/championships/${selectedChampionship.id}/attendees/${attendeeToRemove.userId}`);
      // Optimistically update attendees state
      setAttendees(prevAttendees => 
        prevAttendees.filter(att => att.user_id !== attendeeToRemove.userId)
      );
      handleCloseRemoveAttendee();
    } catch (err) {
      console.error("Error removing attendee:", err);
      setError(err.response?.data?.message || 'remove-attendee-error');
      // Revert optimistic update on error
      fetchAttendees(selectedChampionship.id);
    } finally {
      setIsRemovingAttendee(false);
    }
  };
  // --- END NEW HANDLERS ---

  // --- Bonus Points Dialog Handlers ---
  const handleOpenBonusPointsDialog = (attendee) => {
    const user = userMap.get(attendee.user_id);
    setAttendeeForBonus({
      id: attendee.id, // This is championship_attendees.id
      name: user ? `${user.username} (${user.usertag})` : `User ID ${attendee.user_id}`,
      currentBonusPoints: attendee.bonus_points || 0
    });
    setBonusAmount('');
    setBonusSource(''); // Reset to default or first option if you prefer
    setBonusReason('');
    setOpenBonusPointsDialog(true);
  };

  const handleCloseBonusPointsDialog = () => {
    setOpenBonusPointsDialog(false);
    setAttendeeForBonus(null);
    setBonusAmount('');
    setBonusSource('');
    setBonusReason('');
    // setError(null); // Optionally clear general errors
  };

  const handleSubmitBonusPoints = async () => {
    if (!attendeeForBonus || !bonusAmount || !bonusSource) {
      setError('bonus-points-missing-fields'); // Create this localization key
      return;
    }
    const pointsNum = parseInt(bonusAmount, 10);
    if (isNaN(pointsNum)) {
      setError('bonus-points-invalid-amount'); // Create this localization key
      return;
    }

    setIsAddingBonusPoints(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`/api/championship-attendees/${attendeeForBonus.id}/bonus-points`, {
        points: pointsNum,
        source: bonusSource,
        reason: bonusReason,
      });

      // Optimistically update the attendees state
      setAttendees(prevAttendees =>
        prevAttendees.map(att =>
          att.id === attendeeForBonus.id
            ? { ...att, bonus_points: response.data.updatedBonusPoints }
            : att
        )
      );
      handleCloseBonusPointsDialog();
    } catch (err) {
      console.error("Error adding bonus points:", err);
      setError(err.response?.data?.message || 'add-bonus-points-error');
    } finally {
      setIsAddingBonusPoints(false);
    }
  };
  // --- End Bonus Points Dialog Handlers ---

  // --- Bonus Points Log Dialog Handlers ---
  const handleOpenBonusLogDialog = async (attendee) => {
    const user = userMap.get(attendee.user_id);
    setAttendeeForLog({
      id: attendee.id, // championship_attendees.id
      name: user ? `${user.username} (${user.usertag})` : `User ID ${attendee.user_id}`,
    });
    setOpenBonusLogDialog(true);
    setLoadingBonusLog(true);
    setError(null); // Clear previous errors specific to this modal
    setSuccessMessage(null);
    try {
      const response = await axiosInstance.get(`/api/championship-attendees/${attendee.id}/bonus-points-log`);
      setBonusLogEntries(response.data);
    } catch (err) {
      console.error("Error fetching bonus points log:", err);
      setError(err.response?.data?.message || 'fetch-bonus-log-error');
    } finally {
      setLoadingBonusLog(false);
    }
  };

  const handleCloseBonusLogDialog = () => {
    setOpenBonusLogDialog(false);
    setAttendeeForLog(null);
    setBonusLogEntries([]);
    // setError(null); // Clear error when closing, or manage it per modal
  };
  // --- End Bonus Points Log Dialog Handlers ---

  // Memoized map for quick user lookup
  const userMap = useMemo(() => {
    return new Map(users.map(user => [user.id, user]));
  }, [users]);

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
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}><Localized id={error} fallback={<Localized id='generic-error-fallback' />} /></Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}><Localized id={successMessage} /></Alert>}

      <Grid container spacing={4}>
        {/* Championships Column */}
        <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom><Localized id="admin-championships-heading" /></Typography>
              {loadingChampionships ? (
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
                        <ListItemText primary={champ.name} />
                      </ListItem>
                      {index < championships.length - 1 && <Divider component="li" />} 
                    </React.Fragment>
                  ))}
                  {championships.length === 0 && !loadingChampionships && (
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
                  disabled={isCreatingChamp}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={isCreatingChamp ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  sx={{ mt: 2 }}
                  disabled={isCreatingChamp || !newChampionshipName}
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
            {selectedChampionship && loadingRaces && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
            )}
            {selectedChampionship && !loadingRaces ? (
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
                            disabled={isCreatingRace}
                        />
                         <TextField
                            label={<Localized id="admin-new-race-date-label" />}
                            type="date"
                            value={newRaceDate}
                            onChange={(e) => setNewRaceDate(e.target.value)}
                            required size="small"
                            InputLabelProps={{ shrink: true }}
                            disabled={isCreatingRace}
                        />
                        <Button 
                            type="submit" 
                            variant="contained" 
                            startIcon={isCreatingRace ? <CircularProgress size={20} color="inherit"/> : <AddIcon />}
                            disabled={isCreatingRace || !newRaceTitle || !newRaceDate}
                            sx={{ mt: 0.5 }}
                        >
                            <Localized id="admin-add-race-button" vars={{ champName: selectedChampionship.name }}/>
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
              {(loadingUsers || loadingAttendees) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {attendees.length === 0 
                    ? (<ListItem><ListItemText primary={<Localized id="admin-no-attendees" />} /></ListItem>) 
                    : (attendees.map((attendee, index) => {
                        const user = userMap.get(attendee.user_id);
                        const isUnassigned = attendee.team_id === null;
                        return (
                          <React.Fragment key={attendee.user_id}>
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
      <Dialog open={openEditChampDialog} onClose={handleCloseEditChamp}>
            <DialogTitle><Localized id="admin-edit-championship-title"/></DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus margin="dense" id="name"
                    label={<Localized id="admin-new-championship-label"/>}
                    type="text" fullWidth variant="standard"
                    value={editedChampName}
                    onChange={(e) => setEditedChampName(e.target.value)}
                    required
                />
                <FormControl fullWidth margin="normal" disabled={loadingRacesForEditDialog}>
                  <InputLabel id="lsf-reveal-race-label">
                    <Localized id="admin-lsf-score-reveal-race-label" />
                  </InputLabel>
                  <Select
                    labelId="lsf-reveal-race-label"
                    value={editedChampLsfRevealRaceId}
                    label={<Localized id="admin-lsf-score-reveal-race-label" />}
                    onChange={(e) => setEditedChampLsfRevealRaceId(e.target.value)}
                  >
                    <MenuItem value=""> {/* Represents NULL for live score */}
                      <Localized id="admin-lsf-score-reveal-race-live-option" />
                    </MenuItem>
                    {racesForEditDialog.map((race) => (
                      <MenuItem key={race.id} value={race.id}>
                        {race.title} ({race.date ? new Date(race.date).toLocaleDateString() : 'N/A'})
                      </MenuItem>
                    ))}
                    {loadingRacesForEditDialog && 
                        <MenuItem value={editedChampLsfRevealRaceId} disabled>
                            <em>Loading races...</em>
                        </MenuItem>
                    }
                  </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2}}> 
                <Button onClick={handleCloseEditChamp}><Localized id="admin-cancel-button"/></Button>
                <Button onClick={handleConfirmEditChamp} variant="contained" disabled={isEditingChamp}>
                     {isEditingChamp ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-save-button"/>}
                </Button>
            </DialogActions>
        </Dialog>
        <Dialog open={openDeleteChampDialog} onClose={handleCloseDeleteChamp}>
            <DialogTitle><Localized id="admin-delete-championship-title"/></DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <Localized id="admin-delete-championship-confirm" vars={{ champName: champToDelete?.name || '' }}/>
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2}}> 
                <Button onClick={handleCloseDeleteChamp}><Localized id="admin-cancel-button"/></Button>
                <Button onClick={handleConfirmDeleteChamp} color="error" variant="contained" disabled={isDeletingChamp}>
                    {isDeletingChamp ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-delete-button"/>}
                </Button>
            </DialogActions>
        </Dialog>

       <Dialog open={openEditRaceDialog} onClose={handleCloseEditRace}>
            <DialogTitle><Localized id="admin-edit-race-title"/></DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus margin="dense" id="race-title"
                    label={<Localized id="admin-new-race-title-label"/>}
                    type="text" fullWidth variant="standard"
                    value={editedRaceTitle}
                    onChange={(e) => setEditedRaceTitle(e.target.value)}
                    required
                />
                <TextField
                    margin="dense" id="race-date"
                    label={<Localized id="admin-new-race-date-label"/>}
                    type="date" fullWidth variant="standard"
                    value={editedRaceDate}
                    onChange={(e) => setEditedRaceDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2}}> 
                <Button onClick={handleCloseEditRace}><Localized id="admin-cancel-button"/></Button>
                <Button onClick={handleConfirmEditRace} variant="contained" disabled={isEditingRace}>
                    {isEditingRace ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-save-button"/>}
                </Button>
            </DialogActions>
        </Dialog>
        <Dialog open={openDeleteRaceDialog} onClose={handleCloseDeleteRace}>
            <DialogTitle><Localized id="admin-delete-race-title"/></DialogTitle>
            <DialogContent>
                <DialogContentText>
                     <Localized id="admin-delete-race-confirm" vars={{ raceTitle: raceToDelete?.title || '' }}/>
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2}}> 
                <Button onClick={handleCloseDeleteRace}><Localized id="admin-cancel-button"/></Button>
                <Button onClick={handleConfirmDeleteRace} color="error" variant="contained" disabled={isDeletingRace}>
                     {isDeletingRace ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-delete-button"/>}
                </Button>
            </DialogActions>
        </Dialog>

      {/* Remove Attendee Dialog */}
      <Dialog open={openRemoveAttendeeDialog} onClose={handleCloseRemoveAttendee}>
            <DialogTitle><Localized id="admin-remove-attendee-title"/></DialogTitle>
            <DialogContent>
                <DialogContentText>
                     <Localized id="admin-remove-attendee-confirm" vars={{ userName: attendeeToRemove?.userName || '' , champName: selectedChampionship?.name || '' }}/>
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2}}>
                <Button onClick={handleCloseRemoveAttendee}><Localized id="admin-cancel-button"/></Button>
                <Button onClick={handleConfirmRemoveAttendee} color="error" variant="contained" disabled={isRemovingAttendee}>
                     {isRemovingAttendee ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-remove-button"/>}
                </Button>
            </DialogActions>
        </Dialog>

      {/* Add Bonus Points Dialog */}
      {attendeeForBonus && (
        <Dialog open={openBonusPointsDialog} onClose={handleCloseBonusPointsDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Localized 
              id="admin-add-bonus-points-title" 
              vars={{ userName: attendeeForBonus.name }} 
              fallback={`Add Bonus/Penalty Points for ${attendeeForBonus.name}`}
            />
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="bonus-amount"
              label={<Localized id="admin-bonus-points-amount-label" fallback="Points Amount (can be negative)"/>}
              type="number"
              fullWidth
              variant="outlined"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth margin="dense" variant="outlined" sx={{ mb: 2 }}>
                <InputLabel id="bonus-source-label-id"><Localized id="admin-bonus-points-source-label" fallback="Source"/></InputLabel>
                <Select
                    labelId="bonus-source-label-id"
                    id="bonus-source"
                    value={bonusSource}
                    onChange={(e) => setBonusSource(e.target.value)}
                    label={<Localized id="admin-bonus-points-source-label" fallback="Source"/>}
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
              label={<Localized id="admin-bonus-points-reason-label" fallback="Reason (Optional)"/>}
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={bonusReason}
              onChange={(e) => setBonusReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseBonusPointsDialog} disabled={isAddingBonusPoints}>
              <Localized id="admin-cancel-button"/>
            </Button>
            <Button 
              onClick={handleSubmitBonusPoints} 
              variant="contained" 
              color="primary"
              disabled={isAddingBonusPoints || !bonusAmount || !bonusSource}
              startIcon={isAddingBonusPoints ? <CircularProgress size={20} color="inherit"/> : null}
            >
              <Localized id="admin-submit-bonus-points-button" fallback="Submit Points"/>
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Bonus Points Log Dialog */}
      {attendeeForLog && (
        <Dialog open={openBonusLogDialog} onClose={handleCloseBonusLogDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Localized 
              id="admin-bonus-points-log-title" 
              vars={{ userName: attendeeForLog.name }} 
              fallback={`Bonus Points Log for ${attendeeForLog.name}`}
            />
          </DialogTitle>
          <DialogContent>
            {loadingBonusLog ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
            ) : error && !loadingBonusLog ? ( // Only show error if not loading and error is present
              <Alert severity="error" onClose={() => setError(null)}> 
                <Localized id={error} fallback={<Localized id='generic-error-fallback' />} />
              </Alert>
            ) : bonusLogEntries.length === 0 ? (
              <Typography><Localized id="admin-no-bonus-log-entries" fallback="No bonus point entries found for this attendee."/></Typography>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table size="small" aria-label="bonus points log table">
                  <TableHead>
                    <TableRow>
                      <TableCell><Localized id="bonus-log-points-header" fallback="Points"/></TableCell>
                      <TableCell><Localized id="bonus-log-source-header" fallback="Source"/></TableCell>
                      <TableCell><Localized id="bonus-log-reason-header" fallback="Reason"/></TableCell>
                      <TableCell><Localized id="bonus-log-awarded-at-header" fallback="Date Awarded"/></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bonusLogEntries.map((entry) => (
                      <TableRow key={entry.id}>
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
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseBonusLogDialog}>
              <Localized id="admin-close-button" fallback="Close"/>
            </Button>
          </DialogActions>
        </Dialog>
      )}

    </Container>
  );
}

export default ChampionshipManager; 