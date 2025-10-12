import React, { useEffect, useMemo, useState } from 'react';
import { Container, Box, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress, ToggleButtonGroup, ToggleButton, Button } from '@mui/material';
import { Localized } from '@fluent/react';
import axiosInstance from '../../utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import DriverRankingsView from '../rankings/DriverRankingsView';
import TeamRankingsView from '../rankings/TeamRankingsView';
import ConstructorsRankingsView from '../rankings/ConstructorsRankingsView';
import SpectatorClashesView from './SpectatorClashesView';
import SpectatorRivalsView from './SpectatorRivalsView';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupIcon from '@mui/icons-material/Group';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink } from 'react-router-dom';

function SpectatorRankingsPage() {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(() => localStorage.getItem('spectator:championshipId') || '');
  const [rankingType, setRankingType] = useState('driver');

  const { data: championshipsData = [], isLoading: isLoadingChamps, error: champsError } = useQuery({
    queryKey: ['spectator:championships'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/championships?groupByStatus=true');
      return res.data;
    }
  });

  const championshipsList = useMemo(() => {
    if (!championshipsData || !championshipsData.grouped) {
      return championshipsData || [];
    }
    const flatList = [];
    const statusOrder = ['RUNNING', 'FINISHED', 'HIDDEN'];
    statusOrder.forEach(status => {
      if (championshipsData.data[status]) {
        flatList.push(...championshipsData.data[status]);
      }
    });
    return flatList;
  }, [championshipsData]);

  useEffect(() => {
    if (championshipsList && championshipsList.length > 0) {
      if (!selectedChampionshipId || !championshipsList.find(c => c.id === selectedChampionshipId)) {
        setSelectedChampionshipId(championshipsList[0].id);
      }
    }
  }, [championshipsList, selectedChampionshipId]);

  useEffect(() => {
    if (selectedChampionshipId) {
      localStorage.setItem('spectator:championshipId', selectedChampionshipId);
    }
  }, [selectedChampionshipId]);

  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['spectator:driverRankings', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const driversRes = await axiosInstance.get(`/api/drivers?championshipId=${selectedChampionshipId}`);
      return driversRes.data;
    },
    enabled: !!selectedChampionshipId
  });

  const { data: pointsByRaceData = null, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['spectator:pointsByRace', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return null;
      const response = await axiosInstance.get(`/api/championships/${selectedChampionshipId}/points-by-race`);
      return response.data.success ? response.data.data : null;
    },
    enabled: !!selectedChampionshipId
  });

  const { data: teamRankings = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['spectator:teamRankings', selectedChampionshipId],
    queryFn: async () => {
      if (!selectedChampionshipId) return [];
      const res = await axiosInstance.get(`/api/team-rankings?championshipId=${selectedChampionshipId}`);
      return res.data;
    },
    enabled: !!selectedChampionshipId && rankingType === 'team'
  });

  const championshipConfig = useMemo(() => {
    const selected = championshipsList.find(c => c.id === selectedChampionshipId);
    return selected ? {
      constructors_ranking_mode: selected.constructors_ranking_mode || 'individual',
      constructors_livery_order: selected.constructors_livery_order || 'normal'
    } : null;
  }, [championshipsList, selectedChampionshipId]);

  const loading = isLoadingChamps ||
    (rankingType === 'driver' ? isLoadingDrivers : false) ||
    (rankingType === 'driver' ? isLoadingPoints : false) ||
    (rankingType === 'team' ? isLoadingTeams : false);

  return (
    <Container maxWidth={false} sx={{ mt: 1, mb: 1, px: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button component={RouterLink} to="/spectator" variant="outlined" size="small" startIcon={<HomeIcon />}>
            <Localized id="home" />
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            <Localized id="rankings-page-title" fallback="Rankings" />
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={rankingType}
          exclusive
          onChange={(e, v) => v && setRankingType(v)}
          aria-label="Ranking Type"
          size="small"
          sx={{ mr: 2 }}
        >
          <ToggleButton value="driver"><Localized id="ranking-type-driver" /></ToggleButton>
          <ToggleButton value="team"><Localized id="ranking-type-team" /></ToggleButton>
          <ToggleButton value="clashes"><Localized id="rankings-clashes-tab" /></ToggleButton>
          <ToggleButton value="rivals"><Localized id="ranking-type-rivals" /></ToggleButton>
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 280 }} disabled={isLoadingChamps}>
          <InputLabel id="spectator-championship-select-label"><Localized id="select-championship-label" /></InputLabel>
          <Select
            labelId="spectator-championship-select-label"
            value={selectedChampionshipId}
            label={<Localized id="select-championship-label" />}
            onChange={(e) => setSelectedChampionshipId(e.target.value)}
          >
            {isLoadingChamps && (
              <MenuItem value="" disabled>
                <em><Localized id="loading-championships" /></em>
              </MenuItem>
            )}
            {!isLoadingChamps && championshipsData.grouped && (() => {
              const statusOrder = ['RUNNING', 'FINISHED', 'HIDDEN'];
              const items = [];
              statusOrder.forEach(status => {
                if (championshipsData.data[status] && championshipsData.data[status].length > 0) {
                  items.push(
                    <MenuItem key={`header-${status}`} disabled sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'action.hover',
                      '&.Mui-disabled': { opacity: 1 }
                    }}>
                      <Localized id={`championship-status-${status.toLowerCase()}`} fallback={status} />
                    </MenuItem>
                  );
                  championshipsData.data[status].forEach(champ => {
                    items.push(
                      <MenuItem key={champ.id} value={champ.id} sx={{ pl: 3 }}>
                        {champ.name}
                      </MenuItem>
                    );
                  });
                }
              });
              return items;
            })()}
            {!isLoadingChamps && !championshipsData.grouped && championshipsList.map((champ) => (
              <MenuItem key={champ.id} value={champ.id}>{champ.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ px: 2 }}>
          {rankingType === 'driver' && (
            <DriverRankingsView
              drivers={drivers}
              isMobile={false}
              races={pointsByRaceData?.races || []}
              pointsByRaceData={pointsByRaceData}
            />
          )}
          {rankingType === 'team' && (
            <TeamRankingsView teamRankings={teamRankings} isMobile={false} />
          )}
          {rankingType === 'clashes' && (
            <SpectatorClashesView championshipId={selectedChampionshipId} championshipConfig={championshipConfig} />
          )}
          {rankingType === 'rivals' && (
            <SpectatorRivalsView championshipId={selectedChampionshipId} />
          )}
        </Box>
      )}
    </Container>
  );
}

export default SpectatorRankingsPage;


