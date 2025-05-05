import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Container, Typography, Box, List, ListItem, ListItemText, Button, TextField, Grid, Paper, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Chip, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Localized } from '@fluent/react';

// --- Expected Backend Endpoints --- 
// GET /api/teams - Returns [{ id, name }, ...]
// POST /api/teams - Expects { name: string }, Returns { id, name }
// GET /api/users - Returns [{ id, username, usertag, driver_number }, ...] (for assignment)
// GET /api/championships - Returns [{ id, name }, ...] (to select context for assignment)
// GET /api/championship-attendees?teamId=X&championshipId=Y - Returns attendees for a team in a champ (or fetch all and filter)
// PUT /api/championship-attendees/:attendeeId - Expects { teamId: number | null } (to assign/unassign team)
// PUT /api/teams/:id - Expects { name: string }
// DELETE /api/teams/:id
// -------------------------------------

function TeamManager() {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  // --- State for Assignment ---
  const [championships, setChampionships] = useState([]);
  const [users, setUsers] = useState([]); // All users with id, usertag, driver_number
  const [attendees, setAttendees] = useState([]); // Attendee list for selected champ { id, user_id, team_id, ... }
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(''); // Team selected from the left list
  const [loadingChampionships, setLoadingChampionships] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState(null); // Track which user is being assigned/unassigned
  // --- End Assignment State ---

  // --- State for Team Edit/Delete Modals ---
  const [openEditTeamDialog, setOpenEditTeamDialog] = useState(false);
  const [openDeleteTeamDialog, setOpenDeleteTeamDialog] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null); // { id, name }
  const [teamToDelete, setTeamToDelete] = useState(null); // { id, name }
  const [editedTeamName, setEditedTeamName] = useState('');
  // --- End Team Modal State ---

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
    }
  }, [selectedChampionshipId]);

  const fetchTeams = async () => {
    setLoadingTeams(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/teams`);
      setTeams(response.data);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError('fetch-teams-error'); // Localized ID
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(`${apiUrl}/api/teams`, { name: newTeamName });
      setNewTeamName('');
      fetchTeams(); // Refresh list
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err.response?.data?.message || 'create-team-error'); // Localized ID
    }
  };

  // --- Fetch Functions for Assignment ---
  const fetchChampionships = async () => {
    setLoadingChampionships(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/championships`);
      setChampionships(response.data);
    } catch (err) {
      console.error("Error fetching championships:", err);
      setError('fetch-championships-error');
    } finally {
      setLoadingChampionships(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/users`);
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('fetch-users-error'); // New localization ID
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAttendees = async (champId) => {
    setLoadingAttendees(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/championship-attendees?championshipId=${champId}`);
      setAttendees(response.data);
    } catch (err) {
      console.error("Error fetching attendees:", err);
      setError('fetch-attendees-error'); // New localization ID
    } finally {
      setLoadingAttendees(false);
    }
  };
  // --- End Fetch Functions ---

  // --- Memoized calculations for assigned/available users ---
  const { assignedUsers, availableUsers } = useMemo(() => {
    if (!selectedTeamId || !selectedChampionshipId || users.length === 0) {
      return { assignedUsers: [], availableUsers: [] }; // Return empty if no context
    }

    const assignedUserIds = new Set(
      attendees
        .filter(att => att.team_id === selectedTeamId) // Filter attendees for the selected team
        .map(att => att.user_id) // Get their user IDs
    );

    const assigned = users.filter(user => assignedUserIds.has(user.id));
    // Available = All users NOT in ANY team for THIS championship
    const allAssignedUserIdsInChamp = new Set(attendees.map(att => att.user_id));
    const available = users.filter(user => !allAssignedUserIdsInChamp.has(user.id));

    return { assignedUsers: assigned, availableUsers: available };
  }, [selectedTeamId, selectedChampionshipId, users, attendees]);
  // --- End Memoized calculations ---
  
  // --- Handlers for Assignment ---
  const handleAssignUser = async (userId) => {
      if (!selectedChampionshipId || !selectedTeamId) return; 
      
      setAssigningUserId(userId); 
      setError(null);
      try {
          await axios.put(`${apiUrl}/api/championships/${selectedChampionshipId}/attendees/${userId}/team`, {
              teamId: selectedTeamId 
          });
          fetchAttendees(selectedChampionshipId); 
      } catch (err) {
          console.error(`Error assigning user ${userId} to team ${selectedTeamId}:`, err);
          setError(err.response?.data?.message || 'error-assigning-user');
      } finally {
          setAssigningUserId(null); 
      }
  };

  const handleUnassignUser = async (userId) => {
       if (!selectedChampionshipId || !selectedTeamId) return; // Safety check
       setAssigningUserId(userId); // Set loading state for this user
       setError(null);
       try {
           // Find the attendee record and set team_id to null
           await axios.put(`${apiUrl}/api/championships/${selectedChampionshipId}/attendees/${userId}/team`, {
              teamId: null // Set teamId to null to unassign
           });
           // Refresh attendees list to update UI
           fetchAttendees(selectedChampionshipId); 
       } catch (err) {
          console.error(`Error unassigning user ${userId} from team ${selectedTeamId}:`, err);
          setError(err.response?.data?.message || 'Error unassigning user.'); // Localize later
       } finally {
          setAssigningUserId(null); // Clear loading state for this user
       }
  };
  // --- End Handlers ---

  // --- Team Edit/Delete Modal Handlers ---
  const handleOpenEditTeam = (team) => {
      setTeamToEdit(team);
      setEditedTeamName(team.name);
      setOpenEditTeamDialog(true);
  };

  const handleCloseEditTeam = () => setOpenEditTeamDialog(false);

  const handleOpenDeleteTeam = (team) => {
      setTeamToDelete(team);
      setOpenDeleteTeamDialog(true);
  };

  const handleCloseDeleteTeam = () => setOpenDeleteTeamDialog(false);
  // --- End Team Modal Handlers ---

  // --- Team Edit/Delete API Call Handlers ---
  const handleConfirmEditTeam = async () => {
      if (!teamToEdit || !editedTeamName) return;
      setError(null);
      try {
          await axios.put(`${apiUrl}/api/teams/${teamToEdit.id}`, { name: editedTeamName });
          handleCloseEditTeam();
          fetchTeams(); // Refresh list
          // Note: If edited team was selected, its name will update automatically in the disabled text field
      } catch (err) { 
          console.error("Error editing team:", err); 
          setError(err.response?.data?.message || 'edit-team-error'); // Localized ID
      }
  };

  const handleConfirmDeleteTeam = async () => {
      if (!teamToDelete) return;
      setError(null);
      try {
          // Consider backend implications: What happens to attendees assigned to this team?
          // The schema uses ON DELETE SET NULL for team_id in championship_attendees.
          await axios.delete(`${apiUrl}/api/teams/${teamToDelete.id}`);
          handleCloseDeleteTeam();
          fetchTeams(); // Refresh list
          // If deleted team was selected, clear the selection
          if (selectedTeamId === teamToDelete.id) {
              setSelectedTeamId('');
          }
      } catch (err) { 
          console.error("Error deleting team:", err); 
          setError(err.response?.data?.message || 'delete-team-error'); // Localized ID
      }
  };
  // --- End Team API Call Handlers ---

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        <Localized id="admin-team-manager-title" />
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}><Localized id={error} /></Alert>}

      <Grid container spacing={4}>
        {/* Team List and Creation */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6"><Localized id="admin-teams-heading" /></Typography>
            {loadingTeams ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {teams.map((team) => (
                  <ListItem 
                    key={team.id} 
                    button 
                    selected={selectedTeamId === team.id} 
                    onClick={() => setSelectedTeamId(team.id)}
                    secondaryAction={
                      <>
                        <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); handleOpenEditTeam(team); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleOpenDeleteTeam(team); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText primary={team.name} />
                  </ListItem>
                ))}
                {teams.length === 0 && !loadingTeams && (
                   <ListItem><ListItemText primary={<Localized id="admin-no-teams" />} /></ListItem>
                 )}
              </List>
            )}
            <Typography variant="subtitle1"><Localized id="admin-add-team-subheading" /></Typography>
            <Box component="form" onSubmit={handleCreateTeam} sx={{ mt: 1 }}>
              <TextField
                label={<Localized id="admin-new-team-label" />}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                fullWidth
                required
                size="small"
                sx={{ mb: 1 }}
              />
              <Button type="submit" variant="contained" size="small">
                <Localized id="admin-create-team-button" />
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* User Assignment Section */}
        <Grid item xs={12} md={8}>
           <Paper sx={{ p: 2 }}>
             <Typography variant="h6"><Localized id="admin-assign-users-heading" /></Typography>
             
             {/* Selection Controls */}
             <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 2 }}>
               <FormControl fullWidth size="small">
                 <InputLabel id="champ-select-label"><Localized id="admin-select-championship-label" /></InputLabel>
                 <Select
                   labelId="champ-select-label"
                   value={selectedChampionshipId}
                   label={<Localized id="admin-select-championship-label" />}
                   onChange={(e) => setSelectedChampionshipId(e.target.value)}
                   disabled={loadingChampionships}
                 >
                   <MenuItem value=""><em><Localized id="admin-select-championship-placeholder"/></em></MenuItem>
                   {championships.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                 </Select>
               </FormControl>
                <TextField 
                    label="Selected Team" 
                    value={teams.find(t => t.id === selectedTeamId)?.name || 'No Team Selected'} 
                    disabled 
                    fullWidth 
                    size="small" 
                /> 
             </Box>

             {/* Only show assignment lists if championship and team are selected */}
             {selectedChampionshipId && selectedTeamId ? (
                <Grid container spacing={2}>
                    {/* Available Users List */}
                    <Grid item xs={6}>
                        <Typography variant="subtitle1"><Localized id="admin-available-users-subheading" /></Typography>
                        {loadingUsers || loadingAttendees ? <CircularProgress size={20} /> : (
                            <List dense sx={{ height: 250, overflow: 'auto', border: '1px solid lightgray', p:1, mt: 1 }}>
                                {availableUsers.length === 0 && (
                                    <ListItem><ListItemText primary={<Localized id="admin-no-available-users" />}/></ListItem>
                                )}
                                {availableUsers.map(user => (
                                    <ListItem
                                        key={user.id}
                                        secondaryAction={
                                            <Button 
                                                size="small" 
                                                onClick={() => handleAssignUser(user.id)}
                                                disabled={assigningUserId === user.id} 
                                            >
                                                {assigningUserId === user.id ? <CircularProgress size={16}/> : <Localized id="admin-assign-button"/>}
                                            </Button>
                                        }
                                        disablePadding
                                    >
                                        <ListItemText primary={user.usertag} secondary={`#${user.driver_number} (${user.username})`} sx={{m:0}} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Grid>
                    {/* Assigned Users List */}
                    <Grid item xs={6}>
                        <Typography variant="subtitle1"><Localized id="admin-assigned-users-subheading" vars={{ teamName: teams.find(t => t.id === selectedTeamId)?.name }} /></Typography>
                        {loadingAttendees ? <CircularProgress size={20} /> : (
                            <List dense sx={{ height: 250, overflow: 'auto', border: '1px solid lightgray', p:1, mt: 1 }}>
                                 {assignedUsers.length === 0 && (
                                    <ListItem><ListItemText primary={<Localized id="admin-no-assigned-users" />}/></ListItem>
                                )}
                                {assignedUsers.map(user => (
                                    <ListItem 
                                        key={user.id} 
                                        secondaryAction={
                                            <Button 
                                                size="small" 
                                                color="secondary" 
                                                onClick={() => handleUnassignUser(user.id)}
                                                disabled={assigningUserId === user.id}
                                            >
                                                {assigningUserId === user.id ? <CircularProgress size={16}/> : <Localized id="admin-unassign-button"/>}
                                            </Button>
                                        }
                                        disablePadding
                                    >
                                        <ListItemText primary={user.usertag} secondary={`#${user.driver_number} (${user.username})`} sx={{m:0}} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Grid>
                </Grid>
             ) : (
                 <Typography variant="body2"><Localized id="admin-select-champ-team-prompt" /></Typography>
             )}
           </Paper>
        </Grid>
      </Grid>

      {/* --- Team Dialogs --- */}
      {/* Edit Team */}
      <Dialog open={openEditTeamDialog} onClose={handleCloseEditTeam}>
          <DialogTitle><Localized id="admin-edit-team-title" /></DialogTitle>
          <DialogContent>
              <TextField
                  autoFocus
                  margin="dense"
                  id="team-name"
                  label={<Localized id="admin-new-team-label" />}
                  type="text"
                  fullWidth
                  variant="standard"
                  value={editedTeamName}
                  onChange={(e) => setEditedTeamName(e.target.value)}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseEditTeam}><Localized id="admin-cancel-button" /></Button>
              <Button onClick={handleConfirmEditTeam}><Localized id="admin-save-button" /></Button>
          </DialogActions>
      </Dialog>

      {/* Delete Team */}
      <Dialog open={openDeleteTeamDialog} onClose={handleCloseDeleteTeam}>
          <DialogTitle><Localized id="admin-delete-team-title" /></DialogTitle>
          <DialogContent>
              <DialogContentText>
                  <Localized id="admin-delete-team-confirm" vars={{ teamName: teamToDelete?.name }} />
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseDeleteTeam}><Localized id="admin-cancel-button" /></Button>
              <Button onClick={handleConfirmDeleteTeam} color="error"><Localized id="admin-delete-button" /></Button>
          </DialogActions>
      </Dialog>
      {/* --- End Team Dialogs --- */}
    </Container>
  );
}

export default TeamManager; 