import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { constructorTiers } from '../../utils/constructors';
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

function TeamCard({ teamName, teamId, attendees, driverStats }) {
  // Get drivers for this team
  const teamDrivers = attendees.filter(driver => driver.team_id === teamId);
  
  // Calculate aggregated stats for the team
  const teamStats = teamDrivers.reduce((acc, driver) => {
    const driverStat = driverStats?.find(s => s.user_id === driver.user_id);
    if (driverStat) {
      acc.wins += parseInt(driverStat.wins) || 0;
      acc.poles += parseInt(driverStat.poles) || 0;
      acc.podiums += parseInt(driverStat.podiums) || 0;
      acc.dnfs += parseInt(driverStat.dnfs) || 0;
    }
    return acc;
  }, { wins: 0, poles: 0, podiums: 0, dnfs: 0 });

  return (
    <Paper sx={{ width: 260, minHeight: 420, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }} elevation={3}>
      {/* Side-by-side Profile Pictures */}
      <Box sx={{ position: 'relative', mb: 2, height: 160, width: 200, display: 'flex', justifyContent: 'center', mx: 'auto' }}>
        {teamDrivers.map((driver, index) => {
          const name = driver?.name || '—';
          const img = driver?.driver_picture_url || driver?.driverPictureUrl || null;
          const initials = name && name !== '—' ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : '?';
          
          return (
            <Avatar 
              key={driver.user_id}
              src={img || undefined} 
              alt={name} 
              sx={{ 
                width: 120, 
                height: 120, 
                fontSize: 36,
                position: 'absolute',
                top: index === 0 ? 0 : 20, // First driver on top, second slightly lower
                left: index === 0 ? 0 : 80, // First driver on left, second to the right, overlapping
                zIndex: index === 0 ? 2 : 1, // First driver on top
                border: '3px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              {initials}
            </Avatar>
          );
        })}
      </Box>
      
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>{teamName || '—'}</Typography>
      
      {/* Team Aggregated Stats */}
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196F3' }}>{teamStats.wins}</Typography>
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#9C27B0' }}>{teamStats.poles}</Typography>
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800' }}>{teamStats.podiums}</Typography>
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#F44336' }}>{teamStats.dnfs}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default function SpectatorClashesView({ championshipId, championshipConfig }) {
  const [races, setRaces] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [clashResults, setClashResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isTeamAverageMode = championshipConfig?.constructors_ranking_mode === 'team_average';
  const constructorPairs = [
    { constructor1: 'McLaren', constructor2: 'Red Bull' },
    { constructor1: 'Mercedes', constructor2: 'Ferrari' },
    { constructor1: 'Aston Martin', constructor2: 'Williams' },
    { constructor1: 'VCARB', constructor2: 'Alpine' },
    { constructor1: 'Haas', constructor2: 'Sauber' }
  ];

  const items = useMemo(() => {
    return isTeamAverageMode
      ? constructorPairs.map(p => ({ key: `${p.constructor1}_vs_${p.constructor2}`, label: `${p.constructor1} vs ${p.constructor2}` }))
      : constructorTiers.map(t => ({ key: t.name, label: t.name }));
  }, [isTeamAverageMode]);

  const selectedRace = races.length > 0 ? races[currentRaceIndex] : null;
  const selectedItem = items.length > 0 ? items[currentItemIndex] : null;

  useEffect(() => {
    if (!championshipId) return;
    const fetch = async () => {
      try {
        const reqs = [
          axiosInstance.get(`/api/championships/${championshipId}/races`),
          axiosInstance.get(`/api/drivers?championshipId=${championshipId}`),
          axiosInstance.get(`/api/championships/${championshipId}/driver-stats`)
        ];
        if (isTeamAverageMode) {
          reqs.push(axiosInstance.get(`/api/championship-attendees?championshipId=${championshipId}`));
        }
        const [racesRes, attendeesRes, statsRes, champAttRes] = await Promise.all(reqs);
        const racesData = racesRes.data || [];
        setRaces(racesData);
        setAttendees(attendeesRes.data || []);
        setDriverStats(statsRes.data || []);
        if (isTeamAverageMode && champAttRes) {
          const attendeesData = champAttRes.data || [];
          const uniqueTeamIds = [...new Set(attendeesData.map(a => a.team_id).filter(Boolean))];
          const teamsData = uniqueTeamIds.map(teamId => {
            const driverWithTeam = (attendeesRes.data || []).find(d => d.team_id === teamId);
            return { id: teamId, name: driverWithTeam?.team_name || `Team ${teamId}` };
          });
          setTeams(teamsData);
        }
        
        // Find next race index using same logic as Home.js
        if (racesData.length > 0) {
          const nowMs = Date.now();
          const toCutoff = (dateStr) => {
            const base = new Date(dateStr);
            // 22:00 BRT is UTC-03:00, so 22:00 BRT is 01:00 UTC the next day
            return Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 22 + 3, 0, 0);
          };
          
          const racesWithCutoff = racesData.map((r, idx) => ({ 
            ...r, 
            cutoffMs: r.date ? toCutoff(r.date) : null,
            originalIndex: idx 
          }));
          
          const futureRaces = racesWithCutoff
            .filter(r => r.cutoffMs && r.cutoffMs > nowMs)
            .sort((a, b) => a.cutoffMs - b.cutoffMs);
          
          const nextRaceIndex = futureRaces.length > 0 ? futureRaces[0].originalIndex : 0;
          setCurrentRaceIndex(nextRaceIndex);
        } else {
          setCurrentRaceIndex(0);
        }
        
        setCurrentItemIndex(0);
      } catch (e) {
        console.error(e);
        setError('clashes-loading-error');
      }
    };
    fetch();
  }, [championshipId, isTeamAverageMode]);

  useEffect(() => {
    if (!selectedRace) { setClashResults({}); return; }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(`/api/championships/${championshipId}/races/${selectedRace.id}/clashes`);
        const resultsMap = (res.data.data || []).reduce((acc, item) => {
          const key = item.clash_pair_name || item.clash_constructor_name;
          acc[key] = item;
          return acc;
        }, {});
        setClashResults(resultsMap);
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
  const teamNameById = (teamId) => teams.find(t => t.id === teamId)?.name;

  const renderSelected = () => {
    if (!selectedItem) return null;
    const data = clashResults[selectedItem.key];
    if (isTeamAverageMode) {
      const [constructor1] = selectedItem.key.split('_vs_');
      const leftTeamName = teamNameById(data?.team1_id);
      const rightTeamName = teamNameById(data?.team2_id);
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, mt: 2 }}>
          <TeamCard 
            teamName={leftTeamName} 
            teamId={data?.team1_id} 
            attendees={attendees} 
            driverStats={driverStats} 
          />
          <Typography variant="h5" sx={{ px: 2 }}>VS</Typography>
          <TeamCard 
            teamName={rightTeamName} 
            teamId={data?.team2_id} 
            attendees={attendees} 
            driverStats={driverStats} 
          />
        </Box>
      );
    }
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : (
        renderSelected()
      )}
    </Box>
  );
}


