import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { getCountryCodeForRace } from '../../utils/raceToCountryCode';
import { Box, Typography, CircularProgress, Alert, IconButton, Avatar, Paper } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Localized } from '@fluent/react';

function DriverCard({ driver, driverStats }) {
  const name = driver?.name || '—';
  const img = driver?.driver_picture_url || driver?.driverPictureUrl || null; // support variations
  const initials = name && name !== '—' ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : '?';
  
  const stats = driverStats?.find(s => s.user_id === driver?.user_id);
  
  return (
    <Paper sx={{ width: 260, minHeight: 420, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }} elevation={3}>
      <Avatar src={img || undefined} alt={name} sx={{ width: 160, height: 160, fontSize: 48, mb: 2 }}>
        {initials}
      </Avatar>
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>{name}</Typography>
      
      {stats && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', mt: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 0.5,
            px: 1,
            borderRadius: 1,
            background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
            border: '1px solid rgba(25, 118, 210, 0.2)'
          }}>
            <Typography variant="body2" sx={{ color: '#64B5F6', fontWeight: 500 }}><Localized id="wins-label" fallback="Wins" /></Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196F3' }}>{stats.wins || 0}</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 0.5,
            px: 1,
            borderRadius: 1,
            background: 'linear-gradient(90deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%)',
            border: '1px solid rgba(156, 39, 176, 0.2)'
          }}>
            <Typography variant="body2" sx={{ color: '#BA68C8', fontWeight: 500 }}><Localized id="poles-label" fallback="Poles" /></Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#9C27B0' }}>{stats.poles || 0}</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 0.5,
            px: 1,
            borderRadius: 1,
            background: 'linear-gradient(90deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
            border: '1px solid rgba(255, 152, 0, 0.2)'
          }}>
            <Typography variant="body2" sx={{ color: '#FFB74D', fontWeight: 500 }}><Localized id="podiums-label" fallback="Podiums" /></Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800' }}>{stats.podiums || 0}</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 0.5,
            px: 1,
            borderRadius: 1,
            background: 'linear-gradient(90deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)',
            border: '1px solid rgba(244, 67, 54, 0.2)'
          }}>
            <Typography variant="body2" sx={{ color: '#EF5350', fontWeight: 500 }}><Localized id="dnf-label" fallback="DNF" /></Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#F44336' }}>{stats.dnfs || 0}</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default function SpectatorRivalsView({ championshipId }) {
  const [races, setRaces] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [items, setItems] = useState([]); // Rival items available for the selected race
  const [clashResults, setClashResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedRace = races.length > 0 ? races[currentRaceIndex] : null;
  const selectedItem = items.length > 0 ? items[currentItemIndex] : null;

  useEffect(() => {
    if (!championshipId) return;
    const fetch = async () => {
      try {
        const [racesRes, attendeesRes, statsRes] = await Promise.all([
          axiosInstance.get(`/api/championships/${championshipId}/races`),
          axiosInstance.get(`/api/drivers?championshipId=${championshipId}`),
          axiosInstance.get(`/api/championships/${championshipId}/driver-stats`)
        ]);
        setRaces(racesRes.data || []);
        setAttendees(attendeesRes.data || []);
        setDriverStats(statsRes.data || []);
        setCurrentRaceIndex(0);
        setCurrentItemIndex(0);
      } catch (e) {
        console.error(e);
        setError('clashes-loading-error');
      }
    };
    fetch();
  }, [championshipId]);

  useEffect(() => {
    if (!selectedRace) { setClashResults({}); return; }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(`/api/championships/${championshipId}/races/${selectedRace.id}/rivals`);
        const dataArray = res.data.data || [];
        const resultsMap = dataArray.reduce((acc, item) => {
          const rawKey = item.clash_constructor_name; // e.g., "P1 x P2"
          acc[rawKey] = item;
          return acc;
        }, {});
        setClashResults(resultsMap);
        const newItems = dataArray.map(item => ({ key: item.clash_constructor_name, label: item.clash_constructor_name }));
        setItems(newItems);
        setCurrentItemIndex(0);
      } catch (e) {
        console.error(e);
        setError('clashes-loading-error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedRace, championshipId]);

  const handlePrevRace = () => setCurrentRaceIndex(i => (i - 1 + races.length) % races.length);
  const handleNextRace = () => setCurrentRaceIndex(i => (i + 1) % races.length);
  const handlePrevItem = () => setCurrentItemIndex(i => (i - 1 + items.length) % items.length);
  const handleNextItem = () => setCurrentItemIndex(i => (i + 1) % items.length);

  const driverById = (userId) => attendees.find(a => a.user_id === userId);

  const renderSelected = () => {
    if (!selectedItem) return null;
    const data = clashResults[selectedItem.key];
    const leftDriver = driverById(data?.driver1_user_id);
    const rightDriver = driverById(data?.driver2_user_id);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, mt: 2 }}>
        <DriverCard driver={leftDriver} driverStats={driverStats} />
        <Typography variant="h5" sx={{ px: 2 }}>VS</Typography>
        <DriverCard driver={rightDriver} driverStats={driverStats} />
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      {races.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, p:1, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <IconButton onClick={handlePrevRace} disabled={races.length < 2}><ArrowBackIosNewIcon /></IconButton>
          {selectedRace && (
            <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, textAlign: 'center' }}>
              <img
                src={`https://flagcdn.com/w40/${getCountryCodeForRace(selectedRace.title)}.png`}
                width="40"
                alt={selectedRace.title}
                style={{ marginRight: '10px', display: getCountryCodeForRace(selectedRace.title) ? 'block' : 'none' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Typography variant="h6">{selectedRace.title}</Typography>
            </Box>
          )}
          <IconButton onClick={handleNextRace} disabled={races.length < 2}><ArrowForwardIosIcon /></IconButton>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}><Localized id={error} /></Alert>}

      {items.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, p:1, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
          <IconButton onClick={handlePrevItem} disabled={items.length < 2}><ArrowBackIosNewIcon /></IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>{selectedItem?.label}</Typography>
          <IconButton onClick={handleNextItem} disabled={items.length < 2}><ArrowForwardIosIcon /></IconButton>
        </Box>
      )}
      {items.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Localized id="clashes-no-race-selected" fallback="No rivalry data for this race." />
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : (
        renderSelected()
      )}
    </Box>
  );
}


