import React, { useState, useEffect, useMemo } from 'react';
// Use axiosInstance
import axiosInstance from '../../utils/axiosInstance';
// import axios from 'axios';
import { Container, Typography, Box, List, ListItem, ListItemText, Button, TextField, Grid, Paper, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Chip, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Avatar, ListItemSecondaryAction, ListItemIcon } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group'; // For title
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // Assign icon
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Unassign icon
import { Localized } from '@fluent/react';

// --- Expected Backend Endpoints (use axiosInstance for all) --- 
// GET /api/teams
// POST /api/teams
// GET /api/users
// GET /api/championships
// GET /api/championship-attendees?championshipId=Y (No need for teamId? Fetch all for champ)
// PUT /api/championships/:champId/attendees/:userId/team - Expects { teamId: number | null } 
// PUT /api/teams/:id 
// DELETE /api/teams/:id 
// -------------------------------------

function TeamManager() {
  // --- Base State ---
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [championships, setChampionships] = useState([]);
  const [users, setUsers] = useState([]); 
  const [attendees, setAttendees] = useState([]); 
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(''); 

  // --- Loading State ---
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingChampionships, setLoadingChampionships] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState(null); // For assign/unassign loading
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  // --- Feedback State ---
  const [error, setError] = useState(null);

  // --- Modal State ---
  const [openEditTeamDialog, setOpenEditTeamDialog] = useState(false);
  const [openDeleteTeamDialog, setOpenDeleteTeamDialog] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null); 
  const [teamToDelete, setTeamToDelete] = useState(null); 
  const [editedTeamName, setEditedTeamName] = useState('');

  // --- Initial Data Fetching ---
  useEffect(() => {
    fetchTeams();
    fetchChampionships();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedChampionshipId) {
      fetchAttendees(selectedChampionshipId);
    } else {
      setAttendees([]);
      setSelectedTeamId(''); // Reset team if championship changes
    }
  }, [selectedChampionshipId]);

  // --- API Fetch Functions ---
  const fetchTeams = async () => {
    setLoadingTeams(true); setError(null);
    try { const res = await axiosInstance.get('/api/teams'); setTeams(res.data); }
    catch (err) { console.error("Error fetching teams:", err); setError('fetch-teams-error'); }
    finally { setLoadingTeams(false); }
  };

   const fetchChampionships = async () => {
    setLoadingChampionships(true); setError(null);
    try { const res = await axiosInstance.get('/api/championships'); setChampionships(res.data); }
    catch (err) { console.error("Error fetching champs:", err); setError('fetch-championships-error'); }
    finally { setLoadingChampionships(false); }
  };

   const fetchUsers = async () => {
    setLoadingUsers(true); setError(null);
    try { const res = await axiosInstance.get('/api/users'); setUsers(res.data); }
    catch (err) { console.error("Error fetching users:", err); setError('fetch-users-error'); }
    finally { setLoadingUsers(false); }
  };

   const fetchAttendees = async (champId) => {
    setLoadingAttendees(true); setError(null);
    try { const res = await axiosInstance.get(`/api/championship-attendees?championshipId=${champId}`); setAttendees(res.data); }
    catch (err) { console.error("Error fetching attendees:", err); setError('fetch-attendees-error'); }
    finally { setLoadingAttendees(false); }
  };

  // --- Create/Edit/Delete Handlers ---
  const handleCreateTeam = async (e) => {
    e.preventDefault(); setError(null);
    if (!newTeamName) return;
    setIsCreatingTeam(true);
    try {
      await axiosInstance.post('/api/teams', { name: newTeamName });
      setNewTeamName('');
      fetchTeams(); 
    } catch (err) { 
      console.error("Error creating team:", err); 
      setError(err.response?.data?.message || 'create-team-error');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleAssignUser = async (userId) => {
      if (!selectedChampionshipId || !selectedTeamId) return; 
      setAssigningUserId(userId); setError(null);
      try {
          await axiosInstance.put(`/api/championships/${selectedChampionshipId}/attendees/${userId}/team`, { teamId: selectedTeamId });
          fetchAttendees(selectedChampionshipId);
      } catch (err) { console.error("Assign error:", err); setError(err.response?.data?.message || 'error-assigning-user'); }
      finally { setAssigningUserId(null); }
  };

  const handleUnassignUser = async (userId) => {
       if (!selectedChampionshipId || !selectedTeamId) return;
       setAssigningUserId(userId); setError(null);
       try {
           await axiosInstance.put(`/api/championships/${selectedChampionshipId}/attendees/${userId}/team`, { teamId: null });
           fetchAttendees(selectedChampionshipId);
       } catch (err) { console.error("Unassign error:", err); setError(err.response?.data?.message || 'error-unassigning-user'); }
       finally { setAssigningUserId(null); }
  };

  const handleOpenEditTeam = (team) => {
      setTeamToEdit(team); setEditedTeamName(team.name); setOpenEditTeamDialog(true);
  };
  const handleCloseEditTeam = () => setOpenEditTeamDialog(false);
  const handleOpenDeleteTeam = (team) => {
      setTeamToDelete(team); setOpenDeleteTeamDialog(true);
  };
  const handleCloseDeleteTeam = () => setOpenDeleteTeamDialog(false);

  const handleConfirmEditTeam = async () => {
      if (!teamToEdit || !editedTeamName) return;
      setError(null); setIsEditingTeam(true);
      try {
          await axiosInstance.put(`/api/teams/${teamToEdit.id}`, { name: editedTeamName });
          handleCloseEditTeam(); fetchTeams();
      } catch (err) { console.error("Edit team error:", err); setError(err.response?.data?.message || 'edit-team-error'); }
      finally { setIsEditingTeam(false); }
  };

  const handleConfirmDeleteTeam = async () => {
      if (!teamToDelete) return;
      setError(null); setIsDeletingTeam(true);
      try {
          await axiosInstance.delete(`/api/teams/${teamToDelete.id}`);
          handleCloseDeleteTeam(); fetchTeams();
          if (selectedTeamId === teamToDelete.id) setSelectedTeamId('');
      } catch (err) { console.error("Delete team error:", err); setError(err.response?.data?.message || 'delete-team-error'); }
      finally { setIsDeletingTeam(false); }
  };

  // --- Memoized calculations for user lists ---
  const { assignedUsers, availableUsers } = useMemo(() => {
      if (!selectedChampionshipId || users.length === 0) {
          // If no championship selected, all users are potentially "available" in a general sense
          // but we should probably show nothing or a prompt. Let's return empty for now.
          return { assignedUsers: [], availableUsers: [] };
      }
      const attendeeMap = new Map(attendees.map(att => [att.user_id, att.team_id]));
      
      let assigned = [];
      let available = [];

      users.forEach(user => {
          const userTeamId = attendeeMap.get(user.id);
          if (selectedTeamId && userTeamId === selectedTeamId) {
              assigned.push(user);
          } else if (!attendeeMap.has(user.id)) {
              // User is not an attendee of this championship at all
              available.push(user);
          }
          // Users assigned to *other* teams in this championship are neither available nor assigned to the *selected* team.
      });

      return { assignedUsers: assigned, availableUsers: available };
  }, [selectedChampionshipId, selectedTeamId, users, attendees]);

  // Helper to render user list items
  const renderUserListItem = (user, actionType) => (
     <ListItem key={user.id} divider>
         <ListItemText primary={user.username} secondary={`#${user.driver_number} (${user.usertag})`} />
         <ListItemSecondaryAction>
             <IconButton 
                 edge="end" 
                 onClick={() => actionType === 'assign' ? handleAssignUser(user.id) : handleUnassignUser(user.id)}
                 disabled={assigningUserId === user.id}
                 size="small"
             >
                 {assigningUserId === user.id ? <CircularProgress size={20} /> : 
                    actionType === 'assign' ? <ArrowForwardIcon color="success" /> : <ArrowBackIcon color="warning" />
                 }
            </IconButton>
         </ListItemSecondaryAction>
     </ListItem>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <GroupIcon />
            </Avatar>
            <Typography component="h1" variant="h4">
                <Localized id="admin-team-manager-title" />
            </Typography>
        </Box>

        {/* Use localized generic fallback */} 
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}><Localized id={error} fallback={<Localized id='generic-error-fallback' />} /></Alert>}

        <Grid container spacing={4}>
             {/* Teams Column */} 
            <Grid item xs={12} md={4}>
                {/* Teams List */} 
                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom><Localized id="admin-teams-heading" /></Typography>
                    {loadingTeams ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
                    ) : (
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {teams.map((team, index) => (
                                <React.Fragment key={team.id}>
                                    <ListItem 
                                        button 
                                        selected={selectedTeamId === team.id}
                                        onClick={() => setSelectedTeamId(team.id)}
                                        secondaryAction={
                                            <>
                                                <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); handleOpenEditTeam(team); }} size="small">
                                                    <EditIcon fontSize="inherit"/>
                                                </IconButton>
                                                <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleOpenDeleteTeam(team); }} size="small">
                                                    <DeleteIcon fontSize="inherit"/>
                                                </IconButton>
                                            </>
                                        }
                                    >
                                        <ListItemText primary={team.name} />
                                    </ListItem>
                                    {index < teams.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                            {teams.length === 0 && !loadingTeams && (
                                <ListItem><ListItemText primary={<Localized id="admin-no-teams" />} /></ListItem>
                            )}
                        </List>
                    )}
                </Paper>
                {/* Add Team Form */} 
                 <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom><Localized id="admin-add-team-subheading" /></Typography>
                    <Box component="form" onSubmit={handleCreateTeam} sx={{ mt: 1 }}>
                         <TextField
                            label={<Localized id="admin-new-team-label" />}
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            fullWidth
                            required
                            size="small"
                            margin="dense"
                            disabled={isCreatingTeam}
                        />
                         <Button 
                            type="submit" 
                            variant="contained" 
                            startIcon={isCreatingTeam ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                            sx={{ mt: 2 }}
                            disabled={isCreatingTeam || !newTeamName}
                            fullWidth
                        >
                            <Localized id="admin-create-team-button" />
                        </Button>
                    </Box>
                 </Paper>
            </Grid>

            {/* Assignment Column */} 
            <Grid item xs={12} md={8}>
                <Paper elevation={2} sx={{ p: 3 }}>
                     <Typography variant="h6" gutterBottom><Localized id="admin-assign-users-heading" /></Typography>
                    
                     {/* Selectors */} 
                     <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <FormControl fullWidth sx={{ flex: 1 }} disabled={loadingChampionships || loadingAttendees}>
                            <InputLabel id="champ-select-label"><Localized id="admin-select-championship-label"/></InputLabel>
                            <Select
                                labelId="champ-select-label"
                                value={selectedChampionshipId}
                                label={<Localized id="admin-select-championship-label"/>}
                                onChange={(e) => setSelectedChampionshipId(e.target.value)}
                                size="small"
                            >
                                <MenuItem value="">
                                    <em><Localized id="admin-select-championship-placeholder"/></em>
                                </MenuItem>
                                {championships.map((champ) => (
                                <MenuItem key={champ.id} value={champ.id}>{champ.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={<Localized id="selected-team-label" />}
                            value={teams.find(t => t.id === selectedTeamId)?.name || ''}
                            fullWidth
                            sx={{ flex: 1 }}
                            disabled
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                     </Box>

                     {/* User Lists */} 
                     {(loadingUsers || loadingAttendees) && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>} 
                     
                     {!loadingUsers && !loadingAttendees && !selectedChampionshipId && (
                        <Typography color="text.secondary" sx={{mt: 2}}><Localized id="select-champ-placeholder"/></Typography> 
                     )}

                     {!loadingUsers && !loadingAttendees && selectedChampionshipId && !selectedTeamId && (
                        <Typography color="text.secondary" sx={{mt: 2}}><Localized id="admin-select-team-prompt"/></Typography> /* New Key */
                     )}

                     {!loadingUsers && !loadingAttendees && selectedChampionshipId && selectedTeamId && (
                         <Grid container spacing={3}>
                            {/* Available Users */} 
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1"><Localized id="admin-available-users-subheading" /></Typography>
                                <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 1 }}>
                                    {availableUsers.length === 0 
                                        ? <ListItem><ListItemText primary={<Localized id="admin-no-available-users"/>} /></ListItem>
                                        : availableUsers.map(user => renderUserListItem(user, 'assign'))
                                    }
                                </List>
                            </Grid>
                             {/* Assigned Users */} 
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1">
                                    <Localized id="admin-assigned-users-subheading" vars={{ teamName: teams.find(t => t.id === selectedTeamId)?.name || '' }}/>
                                </Typography>
                                 <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 1 }}>
                                    {assignedUsers.length === 0 
                                        ? <ListItem><ListItemText primary={<Localized id="admin-no-assigned-users"/>} /></ListItem>
                                        : assignedUsers.map(user => renderUserListItem(user, 'unassign'))
                                    }
                                </List>
                            </Grid>
                         </Grid>
                     )}
                </Paper>
            </Grid>
        </Grid>

       {/* Edit Team Dialog */}
        <Dialog open={openEditTeamDialog} onClose={handleCloseEditTeam}>
            <DialogTitle><Localized id="admin-edit-team-title"/></DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label={<Localized id="admin-new-team-label"/>}
                    type="text"
                    fullWidth
                    variant="standard"
                    value={editedTeamName}
                    onChange={(e) => setEditedTeamName(e.target.value)}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2}}> {/* Padding */} 
                <Button onClick={handleCloseEditTeam}><Localized id="admin-cancel-button"/></Button>
                <Button onClick={handleConfirmEditTeam} variant="contained" disabled={isEditingTeam}>
                     {isEditingTeam ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-save-button"/>}
                </Button>
            </DialogActions>
        </Dialog>

      {/* Delete Team Dialog */}
        <Dialog open={openDeleteTeamDialog} onClose={handleCloseDeleteTeam}>
            <DialogTitle><Localized id="admin-delete-team-title"/></DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <Localized id="admin-delete-team-confirm" vars={{ teamName: teamToDelete?.name || '' }}/>
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2}}> {/* Padding */} 
                <Button onClick={handleCloseDeleteTeam}><Localized id="admin-cancel-button"/></Button>
                <Button onClick={handleConfirmDeleteTeam} color="error" variant="contained" disabled={isDeletingTeam}>
                    {isDeletingTeam ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-delete-button"/>}
                </Button>
            </DialogActions>
        </Dialog>

    </Container>
  );
}

export default TeamManager; 