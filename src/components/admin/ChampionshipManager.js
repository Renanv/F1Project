import React, { useState, useEffect, useMemo } from 'react';
// Use axiosInstance
import axiosInstance from '../../utils/axiosInstance';
// import axios from 'axios';
import {
    Container, Typography, Box, List, ListItem, ListItemText, Button, TextField,
    Grid, Paper, CircularProgress, Alert, IconButton, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Divider, Avatar,
    ListItemSecondaryAction
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // For title
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'; // Icon for removing attendee
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

  // --- NEW STATE FOR ATTENDEES/USERS ---
  const [attendees, setAttendees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [attendeeToRemove, setAttendeeToRemove] = useState(null); // { userId, userName }
  const [openRemoveAttendeeDialog, setOpenRemoveAttendeeDialog] = useState(false);
  const [isRemovingAttendee, setIsRemovingAttendee] = useState(false);
  // --- END NEW STATE ---

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
    if (!newChampionshipName) return; // Prevent empty submission
    setIsCreatingChamp(true);
    try {
      await axiosInstance.post('/api/championships', { name: newChampionshipName });
      setNewChampionshipName('');
      fetchChampionships();
    } catch (err) {
      console.error("Error creating championship:", err);
      setError(err.response?.data?.message || 'create-championship-error'); // Use localized key
    } finally {
      setIsCreatingChamp(false);
    }
  };

  const handleCreateRace = async (e) => {
    e.preventDefault();
    if (!selectedChampionship || !newRaceTitle || !newRaceDate) return;
    setError(null);
    setIsCreatingRace(true);
    try {
      await axiosInstance.post(`/api/championships/${selectedChampionship.id}/races`, { 
          title: newRaceTitle, 
          date: newRaceDate
      });
      setNewRaceTitle('');
      setNewRaceDate('');
      fetchRaces(selectedChampionship.id);
    } catch (err) {
      console.error("Error creating race:", err);
      setError(err.response?.data?.message || 'create-race-error'); // Use localized key
    } finally {
        setIsCreatingRace(false);
    }
  };

  // --- Modal Open/Close Handlers ---
  const handleOpenEditChamp = (champ) => {
      setChampToEdit(champ);
      setEditedChampName(champ.name);
      setOpenEditChampDialog(true);
  };
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
          await axiosInstance.put(`/api/championships/${champToEdit.id}`, { name: editedChampName });
          handleCloseEditChamp();
          fetchChampionships();
          if (selectedChampionship?.id === champToEdit.id) {
              setSelectedChampionship(prev => ({ ...prev, name: editedChampName }));
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
          handleCloseDeleteChamp();
          fetchChampionships();
          if (selectedChampionship?.id === champToDelete.id) {
              setSelectedChampionship(null);
          }
      } catch (err) { 
          console.error("Error deleting champ:", err); 
          setError(err.response?.data?.message || 'delete-championship-error'); // Localized ID
      } finally {
          setIsDeletingChamp(false);
      }
  };

  const handleConfirmEditRace = async () => {
      if (!raceToEdit || !editedRaceTitle || !editedRaceDate) return;
      setError(null);
      setIsEditingRace(true);
      try {
          await axiosInstance.put(`/api/races/${raceToEdit.id}`, { title: editedRaceTitle, date: editedRaceDate });
          handleCloseEditRace();
          fetchRaces(selectedChampionship.id);
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
          handleCloseDeleteRace();
          fetchRaces(selectedChampionship.id);
      } catch (err) { 
          console.error("Error deleting race:", err); 
          setError(err.response?.data?.message || 'delete-race-error'); // Localized ID
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
      handleCloseRemoveAttendee();
      fetchAttendees(selectedChampionship.id); // Re-fetch attendees
    } catch (err) {
      console.error("Error removing attendee:", err);
      setError(err.response?.data?.message || 'remove-attendee-error'); // Add new loc key
    } finally {
      setIsRemovingAttendee(false);
    }
  };
  // --- END NEW HANDLERS ---

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
                                <IconButton 
                                  edge="end" 
                                  aria-label="remove attendee" 
                                  onClick={() => handleOpenRemoveAttendee(attendee)}
                                  size="small"
                                  color="error"
                                >
                                  <PersonRemoveIcon fontSize="inherit"/>
                                </IconButton>
                              }
                            >
                              <ListItemText 
                                primary={user ? `${user.username} (${user.usertag})` : `User ID ${attendee.user_id}`}
                                secondary={`#${user?.driver_number ?? 'N/A'}${isUnassigned ? ' - Unassigned' : ''}`} 
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
                />
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

    </Container>
  );
}

export default ChampionshipManager; 