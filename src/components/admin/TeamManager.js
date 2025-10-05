import React, { useState, useEffect, useMemo } from 'react';
// Use axiosInstance
import axiosInstance from '../../utils/axiosInstance';
// import axios from 'axios';
import { Container, Typography, Box, List, ListItem, ListItemText, Button, TextField, Grid, Paper, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Avatar, ListItemSecondaryAction } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group'; // For title
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // Assign icon
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Unassign icon
import { Localized } from '@fluent/react';
import AdminHero from '../AdminHero';
import EmptyState from '../EmptyState';
import { useToast } from '../ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const toast = useToast();
  const queryClient = useQueryClient();

  // --- Base State ---
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(''); 

  // --- Loading State ---
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
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

  // --- React Query for fetching teams ---
  const { 
    data: teams = [], 
    isLoading: isLoadingTeams, 
    error: teamsError 
  } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/teams');
      return res.data;
    },
    onError: (err) => {
      console.error("Error fetching teams:", err);
      setError('fetch-teams-error'); 
    }
  });

  // --- React Query for fetching championships ---
  const { 
    data: championships = [], 
    isLoading: isLoadingChampionships, 
    error: championshipsError 
  } = useQuery({
    queryKey: ['championships'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/championships');
      return res.data;
    },
    onError: (err) => {
      console.error("Error fetching championships:", err);
      setError('fetch-championships-error');
    }
  });

  // --- React Query for fetching users ---
  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    error: usersError 
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/users');
      return res.data;
    },
    onError: (err) => {
      console.error("Error fetching users:", err);
      setError('fetch-users-error');
    }
  });

  // --- React Query for fetching attendees for the selected championship ---
  const { 
    data: attendees = [], 
    isLoading: isLoadingAttendees, 
    error: attendeesError 
  } = useQuery({
    queryKey: ['attendees', selectedChampionshipId], // Query key includes selectedChampionshipId
    queryFn: async () => {
      if (!selectedChampionshipId) return []; // Do not fetch if no championship is selected
      const res = await axiosInstance.get(`/api/championship-attendees?championshipId=${selectedChampionshipId}`);
      return res.data;
    },
    enabled: !!selectedChampionshipId, // Only run query if selectedChampionshipId exists
    onError: (err) => {
      console.error(`Error fetching attendees for championship ${selectedChampionshipId}:`, err);
      setError('fetch-attendees-error'); 
    }
  });

  // --- Initial Data Fetching ---
  useEffect(() => {
    if (selectedChampionshipId) {
      // fetchAttendees(selectedChampionshipId); // Replaced by useQuery
    } else {
      // setAttendees([]); // Handled by useQuery if selectedChampionshipId is null (enabled: false)
      setSelectedTeamId(''); // Reset team if championship changes
    }
  }, [selectedChampionshipId]);

  // --- API Fetch Functions ---
  // const fetchAttendees = async (champId) => {
  //   setLoadingAttendees(true); setError(null);
  //   try { const res = await axiosInstance.get(`/api/championship-attendees?championshipId=${champId}`); setAttendees(res.data); }
  //   catch (err) { console.error("Error fetching attendees:", err); setError('fetch-attendees-error'); }
  //   finally { setLoadingAttendees(false); }
  // };

  // --- React Query Mutation for creating a team ---
  const createTeamMutation = useMutation({
    mutationFn: async (teamName) => {
      const response = await axiosInstance.post('/api/teams', { name: teamName });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setNewTeamName('');
      setError(null); // Clear any previous error
      // Optionally: add success message logic here if needed
    },
    onError: (err) => {
      console.error("Error creating team:", err);
      setError(err.response?.data?.message || 'create-team-error');
    }
  });

  // --- React Query Mutation for assigning/unassigning a user to/from a team ---
  const updateUserTeamAssignmentMutation = useMutation({
    mutationFn: async ({ userId, teamId, championshipId }) => {
      // teamId can be a number or null (for unassigning)
      return axiosInstance.put(`/api/championships/${championshipId}/attendees/${userId}/team`, { teamId });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendees', variables.championshipId] });
      setError(null);
    },
    onError: (err, variables) => {
      console.error(`Error updating team assignment for user ${variables.userId}:`, err);
      setError(err.response?.data?.message || (variables.teamId ? 'error-assigning-user' : 'error-unassigning-user'));
      // Consider refetching attendees on error to revert optimistic updates if we were using them
      // queryClient.invalidateQueries({ queryKey: ['attendees', variables.championshipId] });
    }
  });

  // --- React Query Mutation for editing a team ---
  const editTeamMutation = useMutation({
    mutationFn: async ({ teamId, newName }) => {
      return axiosInstance.put(`/api/teams/${teamId}`, { name: newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      handleCloseEditTeam();
      setError(null);
    },
    onError: (err) => {
      console.error("Edit team error:", err);
      setError(err.response?.data?.message || 'edit-team-error');
      // No need to fetchTeams(); manually, invalidation handles it.
    }
  });

  // --- React Query Mutation for deleting a team ---
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      return axiosInstance.delete(`/api/teams/${teamId}`);
    },
    onSuccess: (data, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      // If the deleted team was selected, clear the selection
      if (selectedTeamId === teamId) {
        setSelectedTeamId('');
      }
      handleCloseDeleteTeam();
      setError(null);
      // Also, potentially invalidate attendees if teams affect their display directly
      // For now, just invalidating teams as primary effect.
    },
    onError: (err) => {
      console.error("Delete team error:", err);
      setError(err.response?.data?.message || 'delete-team-error');
    }
  });

  // --- Create/Edit/Delete Handlers ---
  const handleCreateTeam = async (e) => {
    e.preventDefault(); 
    if (!newTeamName) return;
    createTeamMutation.mutate(newTeamName);
  };

  const handleAssignUser = async (userId) => {
      if (!selectedChampionshipId || !selectedTeamId) return; 
      updateUserTeamAssignmentMutation.mutate({ 
          userId,
          teamId: selectedTeamId,
          championshipId: selectedChampionshipId 
      });
  };

  const handleUnassignUser = async (userId) => {
       if (!selectedChampionshipId) return; // selectedTeamId is not strictly needed for unassign from ANY team
       updateUserTeamAssignmentMutation.mutate({
            userId,
            teamId: null, // Unassign
            championshipId: selectedChampionshipId
       });
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
      editTeamMutation.mutate({ teamId: teamToEdit.id, newName: editedTeamName });
  };

  const handleConfirmDeleteTeam = async () => {
      if (!teamToDelete) return;
      deleteTeamMutation.mutate(teamToDelete.id);
  };

  // --- Memoized calculations for user lists ---
  const { assignedUsers, availableUsers } = useMemo(() => {
      if (!selectedChampionshipId || users.length === 0) {
          return { assignedUsers: [], availableUsers: [] };
      }
      const attendeeMap = new Map(attendees.map(att => [att.user_id, att.team_id]));
      
      let assigned = [];
      let available = [];

      users.forEach(user => {
          const userTeamId = attendeeMap.get(user.id);
          const isAttendee = attendeeMap.has(user.id);

          if (selectedTeamId && isAttendee && userTeamId === selectedTeamId) {
              // User is an attendee and assigned to the currently selected team
              assigned.push(user);
          } else if (!isAttendee || userTeamId === null) {
              // User is NOT an attendee OR is an attendee but has no team assigned (team_id is null)
              available.push(user);
          }
          // Users who are attendees AND assigned to a *different* team are ignored (not available, not assigned to selected)
      });

      return { assignedUsers: assigned, availableUsers: available };
  }, [selectedChampionshipId, selectedTeamId, users, attendees]);

  // Helper to render user list items
  const renderUserListItem = (user, actionType) => {
    const isLoadingForThisUser = 
        (updateUserTeamAssignmentMutation.isLoading && 
         updateUserTeamAssignmentMutation.variables?.userId === user.id &&
         ((actionType === 'assign' && updateUserTeamAssignmentMutation.variables?.teamId !== null) || 
          (actionType === 'unassign' && updateUserTeamAssignmentMutation.variables?.teamId === null)));

    return (
     <ListItem key={user.id} divider>
         <ListItemText primary={user.username} secondary={`#${user.driver_number} (${user.usertag})`} />
         <ListItemSecondaryAction>
             <IconButton 
                 edge="end" 
                 onClick={() => actionType === 'assign' ? handleAssignUser(user.id) : handleUnassignUser(user.id)}
                 disabled={isLoadingForThisUser}
                 size="small"
             >
                 {isLoadingForThisUser ? <CircularProgress size={20} /> :
                    actionType === 'assign' ? <ArrowForwardIcon color="success" /> : <ArrowBackIcon color="warning" />
                 }
            </IconButton>
         </ListItemSecondaryAction>
     </ListItem>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <AdminHero titleId="admin-team-manager-title" />

        {/* Use localized generic fallback */} 
        {error && (() => { toast.show('error', <Localized id={error} />); return null; })()}

        <Grid container spacing={4}>
             {/* Teams Column */} 
            <Grid item xs={12} md={4}>
                {/* Teams List */} 
                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom><Localized id="admin-teams-heading" /></Typography>
                    {isLoadingTeams ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
                    ) : teamsError ? (
                        <Alert severity="error" sx={{my: 2}}><Localized id='fetch-teams-error' /></Alert>
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
                            {teams.length === 0 && !isLoadingTeams && (
                                <ListItem><EmptyState titleId="admin-teams-heading" messageId="admin-no-teams" /></ListItem>
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
                            disabled={createTeamMutation.isLoading}
                        />
                         <Button 
                            type="submit" 
                            variant="contained" 
                            startIcon={createTeamMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                            sx={{ mt: 2 }}
                            disabled={createTeamMutation.isLoading || !newTeamName}
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
                     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                        <FormControl fullWidth sx={{ flex: {sm: 1} }} disabled={isLoadingChampionships || isLoadingAttendees}>
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
                                {isLoadingChampionships ? (
                                    <MenuItem value="" disabled><em><Localized id='loading-championships'/></em></MenuItem>
                                 ) : championshipsError ? (
                                    <MenuItem value="" disabled sx={{color: 'error.main'}}><em><Localized id='fetch-championships-error'/></em></MenuItem>
                                 ) : championships.map((champ) => (
                                <MenuItem key={champ.id} value={champ.id}>{champ.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={<Localized id="selected-team-label" />}
                            value={teams.find(t => t.id === selectedTeamId)?.name || ''}
                            fullWidth
                            sx={{ flex: {sm: 1} }}
                            disabled
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                     </Box>

                     {/* User Lists */} 
                     {(isLoadingUsers || isLoadingAttendees) && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>} 
                     
                     {(!isLoadingUsers && !usersError && !isLoadingAttendees && !attendeesError && !selectedChampionshipId) && (
                        <Typography color="text.secondary" sx={{mt: 2}}><Localized id="select-champ-placeholder"/></Typography> 
                     )}
                     {usersError && <Alert severity="error" sx={{my: 2}}><Localized id='fetch-users-error' /></Alert>}
                     {attendeesError && <Alert severity="error" sx={{my: 2}}><Localized id='fetch-attendees-error' /></Alert>}

                     {(!isLoadingUsers && !usersError && !isLoadingAttendees && !attendeesError && selectedChampionshipId && !selectedTeamId) && (
                        <Typography color="text.secondary" sx={{mt: 2}}><Localized id="admin-select-team-prompt"/></Typography> 
                     )}

                     {(!isLoadingUsers && !usersError && !isLoadingAttendees && !attendeesError && selectedChampionshipId && selectedTeamId) && (
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
                <Button onClick={handleConfirmEditTeam} variant="contained" disabled={editTeamMutation.isLoading}>
                     {editTeamMutation.isLoading ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-save-button"/>}
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
                <Button onClick={handleConfirmDeleteTeam} color="error" variant="contained" disabled={deleteTeamMutation.isLoading}>
                    {deleteTeamMutation.isLoading ? <CircularProgress size={20} color="inherit"/> : <Localized id="admin-delete-button"/>}
                </Button>
            </DialogActions>
        </Dialog>

    </Container>
  );
}

export default TeamManager; 