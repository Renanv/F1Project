import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, List, ListItem, ListItemText, Button, TextField, Grid, Paper, CircularProgress, Alert, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

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

  // Fetch championships on mount
  useEffect(() => {
    fetchChampionships();
  }, []);

  // Fetch races when a championship is selected
  useEffect(() => {
    if (selectedChampionship) {
      fetchRaces(selectedChampionship.id);
    } else {
      setRaces([]); // Clear races if no championship is selected
    }
  }, [selectedChampionship]);

  const fetchChampionships = async () => {
    setLoadingChampionships(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/championships`);
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
      const response = await axios.get(`${apiUrl}/api/championships/${champId}/races`);
      setRaces(response.data);
    } catch (err) {
      console.error(`Error fetching races for championship ${champId}:`, err);
      setError('fetch-races-error'); // Use localized ID
    } finally {
      setLoadingRaces(false);
    }
  };

  const handleCreateChampionship = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(`${apiUrl}/api/championships`, { name: newChampionshipName });
      setNewChampionshipName('');
      fetchChampionships();
    } catch (err) {
      console.error("Error creating championship:", err);
      setError(err.response?.data?.message || 'create-championship-error');
    }
  };

  const handleCreateRace = async (e) => {
    e.preventDefault();
    if (!selectedChampionship) return;
    setError(null);
    try {
      await axios.post(`${apiUrl}/api/championships/${selectedChampionship.id}/races`, { 
          title: newRaceTitle, 
          date: newRaceDate
      });
      setNewRaceTitle('');
      setNewRaceDate('');
      fetchRaces(selectedChampionship.id);
    } catch (err) {
      console.error("Error creating race:", err);
      setError(err.response?.data?.message || 'create-race-error');
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
  
  // --- API Call Handlers ---
  const handleConfirmEditChamp = async () => {
      if (!champToEdit || !editedChampName) return;
      setError(null);
      try {
          await axios.put(`${apiUrl}/api/championships/${champToEdit.id}`, { name: editedChampName });
          handleCloseEditChamp();
          fetchChampionships();
          if (selectedChampionship?.id === champToEdit.id) {
              setSelectedChampionship(prev => ({ ...prev, name: editedChampName }));
          }
      } catch (err) { 
          console.error("Error editing champ:", err); 
          setError(err.response?.data?.message || 'edit-championship-error'); // Localized ID
      }
  };

  const handleConfirmDeleteChamp = async () => {
      if (!champToDelete) return;
      setError(null);
      try {
          await axios.delete(`${apiUrl}/api/championships/${champToDelete.id}`);
          handleCloseDeleteChamp();
          fetchChampionships();
          if (selectedChampionship?.id === champToDelete.id) {
              setSelectedChampionship(null);
          }
      } catch (err) { 
          console.error("Error deleting champ:", err); 
          setError(err.response?.data?.message || 'delete-championship-error'); // Localized ID
      }
  };

  const handleConfirmEditRace = async () => {
      if (!raceToEdit || !editedRaceTitle || !editedRaceDate) return;
      setError(null);
      try {
          await axios.put(`${apiUrl}/api/races/${raceToEdit.id}`, { title: editedRaceTitle, date: editedRaceDate });
          handleCloseEditRace();
          fetchRaces(selectedChampionship.id);
      } catch (err) { 
          console.error("Error editing race:", err); 
          setError(err.response?.data?.message || 'edit-race-error'); // Localized ID
      }
  };

  const handleConfirmDeleteRace = async () => {
      if (!raceToDelete) return;
      setError(null);
      try {
          await axios.delete(`${apiUrl}/api/races/${raceToDelete.id}`);
          handleCloseDeleteRace();
          fetchRaces(selectedChampionship.id);
      } catch (err) { 
          console.error("Error deleting race:", err); 
          setError(err.response?.data?.message || 'delete-race-error'); // Localized ID
      }
  };
  // --- End API Call Handlers ---

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        <Localized id="admin-championship-manager-title" />
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}><Localized id={error} /></Alert>}

      <Grid container spacing={4}>
        {/* Championship List and Creation */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6"><Localized id="admin-championships-heading" /></Typography>
            {loadingChampionships ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {championships.map((champ) => (
                  <ListItem 
                    key={champ.id} 
                    button 
                    selected={selectedChampionship?.id === champ.id}
                    onClick={() => setSelectedChampionship(champ)}
                    secondaryAction={
                      <>
                        <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); handleOpenEditChamp(champ); }}>
                          <EditIcon fontSize="small"/>
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleOpenDeleteChamp(champ); }}>
                          <DeleteIcon fontSize="small"/>
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText primary={champ.name} />
                  </ListItem>
                ))}
                {championships.length === 0 && !loadingChampionships && (
                  <ListItem><ListItemText primary={<Localized id="admin-no-championships" />} /></ListItem>
                )}
              </List>
            )}
            <Typography variant="subtitle1"><Localized id="admin-add-championship-subheading" /></Typography>
            <Box component="form" onSubmit={handleCreateChampionship} sx={{ mt: 1 }}>
              <TextField
                label={<Localized id="admin-new-championship-label" />}
                value={newChampionshipName}
                onChange={(e) => setNewChampionshipName(e.target.value)}
                fullWidth
                required
                size="small"
                sx={{ mb: 1 }}
              />
              <Button type="submit" variant="contained" size="small">
                <Localized id="admin-create-championship-button" />
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Race List and Creation (for selected championship) */}
        <Grid item xs={12} md={8}>
          {selectedChampionship && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6"><Localized id="admin-races-heading" vars={{ champName: selectedChampionship.name }}/></Typography>
              {loadingRaces ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
              ) : (
                <List dense sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                  {races.map((race) => (
                    <ListItem 
                      key={race.id}
                      secondaryAction={
                        <>
                          <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditRace(race)}>
                            <EditIcon fontSize="small"/>
                          </IconButton>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleOpenDeleteRace(race)}>
                            <DeleteIcon fontSize="small"/>
                          </IconButton>
                        </>
                      }
                    >
                      <ListItemText 
                        primary={race.title} 
                        secondary={<Localized id="admin-race-date-label" vars={{ raceDate: race.date ? new Date(race.date).toLocaleDateString() : 'Not Set' }} />} 
                      />
                    </ListItem>
                  ))}
                  {races.length === 0 && !loadingRaces && (
                    <ListItem><ListItemText primary={<Localized id="admin-no-races" />} /></ListItem>
                  )}
                </List>
              )}
              <Typography variant="subtitle1"><Localized id="admin-add-race-subheading" /></Typography>
              <Box component="form" onSubmit={handleCreateRace} sx={{ mt: 1 }}>
                <TextField
                  label={<Localized id="admin-new-race-title-label" />}
                  value={newRaceTitle}
                  onChange={(e) => setNewRaceTitle(e.target.value)}
                  fullWidth
                  required
                  size="small"
                  sx={{ mb: 1 }}
                />
                 <TextField
                  label={<Localized id="admin-new-race-date-label" />}
                  type="date"
                  value={newRaceDate}
                  onChange={(e) => setNewRaceDate(e.target.value)}
                  fullWidth
                  required
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 1 }}
                />
                <Button type="submit" variant="contained" size="small">
                  <Localized id="admin-add-race-button" vars={{ champName: selectedChampionship.name }} />
                </Button>
              </Box>
            </Paper>
          )}
          {!selectedChampionship && (
             <Typography><Localized id="admin-select-championship-prompt" /></Typography>
          )}
        </Grid>
      </Grid>

      {/* --- Dialogs --- */}
      {/* Edit Championship */}
      <Dialog open={openEditChampDialog} onClose={handleCloseEditChamp}>
          <DialogTitle><Localized id="admin-edit-championship-title" /></DialogTitle>
          <DialogContent>
              <TextField
                  autoFocus
                  margin="dense"
                  id="champ-name"
                  label={<Localized id="admin-new-championship-label" />}
                  type="text"
                  fullWidth
                  variant="standard"
                  value={editedChampName}
                  onChange={(e) => setEditedChampName(e.target.value)}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseEditChamp}><Localized id="admin-cancel-button" /></Button>
              <Button onClick={handleConfirmEditChamp}><Localized id="admin-save-button" /></Button>
          </DialogActions>
      </Dialog>

      {/* Delete Championship */}
      <Dialog open={openDeleteChampDialog} onClose={handleCloseDeleteChamp}>
          <DialogTitle><Localized id="admin-delete-championship-title" /></DialogTitle>
          <DialogContent>
              <DialogContentText>
                  <Localized id="admin-delete-championship-confirm" vars={{ champName: champToDelete?.name }} />
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseDeleteChamp}><Localized id="admin-cancel-button" /></Button>
              <Button onClick={handleConfirmDeleteChamp} color="error"><Localized id="admin-delete-button" /></Button>
          </DialogActions>
      </Dialog>

      {/* Edit Race */}
      <Dialog open={openEditRaceDialog} onClose={handleCloseEditRace}>
          <DialogTitle><Localized id="admin-edit-race-title" /></DialogTitle>
          <DialogContent>
              <TextField
                  autoFocus
                  margin="dense"
                  id="race-title"
                  label={<Localized id="admin-new-race-title-label" />}
                  type="text"
                  fullWidth
                  variant="standard"
                  value={editedRaceTitle}
                  onChange={(e) => setEditedRaceTitle(e.target.value)}
                  sx={{ mb: 2 }}
              />
               <TextField
                  margin="dense"
                  id="race-date"
                  label={<Localized id="admin-new-race-date-label" />} 
                  type="date" 
                  fullWidth
                  variant="standard"
                  value={editedRaceDate}
                  onChange={(e) => setEditedRaceDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseEditRace}><Localized id="admin-cancel-button" /></Button>
              <Button onClick={handleConfirmEditRace}><Localized id="admin-save-button" /></Button>
          </DialogActions>
      </Dialog>

      {/* Delete Race */}
      <Dialog open={openDeleteRaceDialog} onClose={handleCloseDeleteRace}>
          <DialogTitle><Localized id="admin-delete-race-title" /></DialogTitle>
          <DialogContent>
              <DialogContentText>
                  <Localized id="admin-delete-race-confirm" vars={{ raceTitle: raceToDelete?.title }} />
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseDeleteRace}><Localized id="admin-cancel-button" /></Button>
              <Button onClick={handleConfirmDeleteRace} color="error"><Localized id="admin-delete-button" /></Button>
          </DialogActions>
      </Dialog>
      {/* --- End Dialogs --- */}
    </Container>
  );
}

export default ChampionshipManager; 