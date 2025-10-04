import React, { useState, useEffect } from 'react';
import { constructorTiers } from '../../utils/constructors';
import { 
    Box, 
    Typography, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Grid,
    Paper,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { Localized } from '@fluent/react';

// A single clash pair row for team average mode (constructor pair vs constructor pair)
function ClashPairRow({
    constructorPair,
    raceData, // Data for this specific clash pair from the backend
    teams, // List of all possible teams in the championship
    allSelectedTeamIds,
    isAdmin,
    onUpdate // Callback to parent to save changes
}) {
    const [team1, setTeam1] = useState(raceData?.team1_id || '');
    const [team2, setTeam2] = useState(raceData?.team2_id || '');
    const [qualyWinner, setQualyWinner] = useState(raceData?.qualy_winner_team_id || null);
    const [lapWinner, setLapWinner] = useState(raceData?.fastest_lap_winner_team_id || null);
    const [posWinner, setPosWinner] = useState(raceData?.race_position_winner_team_id || null);

    // Get constructor info from constructorTiers
    const constructor1Info = constructorTiers.find(t => t.name === constructorPair.constructor1);
    const constructor2Info = constructorTiers.find(t => t.name === constructorPair.constructor2);

    // Update local state if the race data from parent changes
    useEffect(() => {
        setTeam1(raceData?.team1_id || '');
        setTeam2(raceData?.team2_id || '');
        setQualyWinner(raceData?.qualy_winner_team_id || null);
        setLapWinner(raceData?.fastest_lap_winner_team_id || null);
        setPosWinner(raceData?.race_position_winner_team_id || null);
    }, [raceData]);

    const handleUpdate = (field, value) => {
        const payload = {
            clash_pair_name: `${constructorPair.constructor1}_vs_${constructorPair.constructor2}`,
            team1_id: field === 'team1' ? value : team1,
            team2_id: field === 'team2' ? value : team2,
            qualy_winner_team_id: field === 'qualy' ? value : qualyWinner,
            fastest_lap_winner_team_id: field === 'lap' ? value : lapWinner,
            race_position_winner_team_id: field === 'pos' ? value : posWinner,
        };
        onUpdate(payload);
    };

    const handleCheckboxChange = (category, winner) => {
        const currentWinner = category === 'qualy' ? qualyWinner : category === 'lap' ? lapWinner : posWinner;
        const newWinner = currentWinner === winner ? null : winner; // Toggle logic
        
        if (category === 'qualy') setQualyWinner(newWinner);
        else if (category === 'lap') setLapWinner(newWinner);
        else setPosWinner(newWinner);

        handleUpdate(category, newWinner);
    };

    const getAvailableTeams = (otherTeamInClash) => {
        // A team is available for this dropdown if...
        return teams.filter(team => {
            // They are not the other team already selected in this same clash
            const isOtherTeam = team.id === otherTeamInClash;
            if (isOtherTeam) return false;

            // They are not selected in any other clash
            const isSelectedElsewhere = allSelectedTeamIds.has(team.id);
            
            // But if they are selected elsewhere, we still need to allow them to show up
            // if they are the team for THIS clash.
            const isSelectedInThisClash = team.id === team1 || team.id === team2;

            return !isSelectedElsewhere || isSelectedInThisClash;
        });
    };

    const teamSelect = (teamNumber, value) => {
        const handleTeamChange = (e) => {
            const newValue = e.target.value;
            if (teamNumber === 1) {
                setTeam1(newValue);
                handleUpdate('team1', newValue);
            } else {
                setTeam2(newValue);
                handleUpdate('team2', newValue);
            }
        };

        if (isAdmin) {
            // Determine the list of available teams for this specific dropdown
            const availableList = getAvailableTeams(teamNumber === 1 ? team2 : team1);

            return (
                <FormControl fullWidth size="small">
                    <InputLabel><Localized id="clashes-team-label" vars={{number: teamNumber}} fallback={`Team ${teamNumber}`} /></InputLabel>
                    <Select
                        value={value}
                        label={`Team ${teamNumber}`}
                        onChange={handleTeamChange}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {availableList.map(team => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
                    </Select>
                </FormControl>
            );
        }

        // For non-admins, show plain text
        const team = teams.find(t => t.id === value);
        return (
             <Box sx={{ p: '8.5px 14px', border: '1px solid rgba(255, 255, 255, 0.23)', borderRadius: 1, minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1">{team ? team.name : 'N/A'}</Typography>
            </Box>
        );
    };

    const renderCheckboxes = (selectedTeamId) => {
        if (!selectedTeamId) return null;
        
        const categories = [
            { key: 'qualy', labelId: 'clashes-qualy', winner: qualyWinner, handler: () => handleCheckboxChange('qualy', selectedTeamId) },
            { key: 'lap', labelId: 'clashes-fastest-lap', winner: lapWinner, handler: () => handleCheckboxChange('lap', selectedTeamId) },
            { key: 'pos', labelId: 'clashes-race-finish', winner: posWinner, handler: () => handleCheckboxChange('pos', selectedTeamId) }
        ];

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {isAdmin ? (
                    categories.map(cat => (
                        <FormControlLabel
                            key={cat.key}
                            sx={{ height: '30px' }} // Tighter spacing
                            control={<Checkbox sx={{ py: 0 }} checked={cat.winner === selectedTeamId} onChange={cat.handler} />}
                            label={<Localized id={cat.labelId} />}
                        />
                    ))
                ) : (
                     categories.map(cat => (
                        <Box key={cat.key} sx={{ display: 'flex', alignItems: 'center', height: '30px' }}>
                            <Typography sx={{ mr: 1, width: '20px' }}>{cat.winner === selectedTeamId ? '✔️' : '❌'}</Typography>
                            <Localized id={cat.labelId} />
                        </Box>
                    ))
                )}
            </Box>
        );
    };

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                <span style={{ color: constructor1Info?.color || '#000' }}>
                    {constructorPair.constructor1}
                </span>
                {' vs '}
                <span style={{ color: constructor2Info?.color || '#000' }}>
                    {constructorPair.constructor2}
                </span>
            </Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3.5}>
                    {teamSelect(1, team1)}
                </Grid>
                <Grid item xs={5} md={2.5}>
                    {renderCheckboxes(team1)}
                </Grid>
                <Grid item xs={2} md={1} sx={{ textAlign: 'center' }}>
                    <Typography>VS</Typography>
                </Grid>
                <Grid item xs={5} md={2.5}>
                    {renderCheckboxes(team2)}
                </Grid>
                <Grid item xs={12} md={2.5}>
                    {teamSelect(2, team2)}
                </Grid>
            </Grid>
        </Paper>
    );
}

export default ClashPairRow;
