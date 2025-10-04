import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { constructorTiers } from '../../utils/constructors'; // The source of truth for the static layout
import { getCountryCodeForRace } from '../../utils/raceToCountryCode'; // Import the new helper
import { 
    Box, 
    Typography, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    CircularProgress, 
    Alert,
    Grid,
    Paper,
    Checkbox,
    Button,
    FormControlLabel,
    IconButton // Import IconButton
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'; // Import Icon
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'; // Import Icon
import { Localized } from '@fluent/react';

// A single clash row for individual mode (constructor vs itself)
function ClashRow({
    constructorTeam,
    raceData, // Data for this specific clash from the backend
    attendees, // List of all possible drivers in the championship
    allSelectedDriverIds,
    isAdmin,
    onUpdate // Callback to parent to save changes
}) {
    const [driver1, setDriver1] = useState(raceData?.driver1_user_id || '');
    const [driver2, setDriver2] = useState(raceData?.driver2_user_id || '');
    const [qualyWinner, setQualyWinner] = useState(raceData?.qualy_winner_user_id || null);
    const [lapWinner, setLapWinner] = useState(raceData?.fastest_lap_winner_user_id || null);
    const [posWinner, setPosWinner] = useState(raceData?.race_position_winner_user_id || null);

    // Update local state if the race data from parent changes
    useEffect(() => {
        setDriver1(raceData?.driver1_user_id || '');
        setDriver2(raceData?.driver2_user_id || '');
        setQualyWinner(raceData?.qualy_winner_user_id || null);
        setLapWinner(raceData?.fastest_lap_winner_user_id || null);
        setPosWinner(raceData?.race_position_winner_user_id || null);
    }, [raceData]);

    const handleUpdate = (field, value) => {
        const payload = {
            clash_constructor_name: constructorTeam.name,
            driver1_user_id: field === 'driver1' ? value : driver1,
            driver2_user_id: field === 'driver2' ? value : driver2,
            qualy_winner_user_id: field === 'qualy' ? value : qualyWinner,
            fastest_lap_winner_user_id: field === 'lap' ? value : lapWinner,
            race_position_winner_user_id: field === 'pos' ? value : posWinner,
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

    const renderCheckboxes = (driverId) => {
        if (!driverId) return null;
        
        const categories = [
            { key: 'qualy', labelId: 'clashes-qualy', winner: qualyWinner, handler: () => handleCheckboxChange('qualy', driverId) },
            { key: 'lap', labelId: 'clashes-fastest-lap', winner: lapWinner, handler: () => handleCheckboxChange('lap', driverId) },
            { key: 'pos', labelId: 'clashes-race-finish', winner: posWinner, handler: () => handleCheckboxChange('pos', driverId) }
        ];

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {isAdmin ? (
                    categories.map(cat => (
                        <FormControlLabel
                            key={cat.key}
                            sx={{ height: '30px' }} // Tighter spacing
                            control={<Checkbox sx={{ py: 0 }} checked={cat.winner === driverId} onChange={cat.handler} />}
                            label={<Localized id={cat.labelId}><Typography variant="body2"></Typography></Localized>}
                        />
                    ))
                ) : (
                     categories.map(cat => (
                        <Box key={cat.key} sx={{ display: 'flex', alignItems: 'center', height: '30px' }}>
                            <Typography sx={{ mr: 1, width: '20px' }}>{cat.winner === driverId ? '✔️' : '❌'}</Typography>
                            <Localized id={cat.labelId}><Typography variant="body2"></Typography></Localized>
                        </Box>
                    ))
                )}
            </Box>
        );
    };

    const getAvailableAttendees = (otherDriverInClash) => {
        // A driver is available for this dropdown if...
        return attendees.filter(attendee => {
            // They are not the other driver already selected in this same clash
            const isOtherDriver = attendee.user_id === otherDriverInClash;
            if (isOtherDriver) return false;

            // They are not selected in any other clash
            const isSelectedElsewhere = allSelectedDriverIds.has(attendee.user_id);
            
            // But if they are selected elsewhere, we still need to allow them to show up
            // if they are the driver for THIS clash.
            const isSelectedInThisClash = attendee.user_id === driver1 || attendee.user_id === driver2;

            return !isSelectedElsewhere || isSelectedInThisClash;
        });
    };

    const driverSelect = (driverNum, value, onChange) => {
        if (isAdmin) {
            // Determine the list of available drivers for this specific dropdown
            const availableList = getAvailableAttendees(driverNum === 1 ? driver2 : driver1);

            return (
                <FormControl fullWidth size="small">
                    <InputLabel>{`Piloto ${driverNum}`}</InputLabel>
                    <Select
                        value={value}
                        label={`Piloto ${driverNum}`}
                        onChange={onChange}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {availableList.map(a => <MenuItem key={a.user_id} value={a.user_id}>{a.name}</MenuItem>)}
                    </Select>
                </FormControl>
            );
        }

        // For non-admins, show plain text
        const driver = attendees.find(a => a.user_id === value);
        return (
             <Box sx={{ p: '8.5px 14px', border: '1px solid rgba(255, 255, 255, 0.23)', borderRadius: 1, minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1">{driver ? driver.name : 'N/A'}</Typography>
            </Box>
        );
    };
    
    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ color: constructorTeam.color, textShadow: constructorTeam.textColor ? `1px 1px 2px ${constructorTeam.textColor}`: 'none', mb: 1 }}>
                {constructorTeam.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                    {driverSelect(1, driver1, (e) => {
                        setDriver1(e.target.value);
                        handleUpdate('driver1', e.target.value);
                    })}
                </Box>
                <Box sx={{ minWidth: '80px' }}>
                    {renderCheckboxes(driver1)}
                </Box>
                <Typography variant="h6" sx={{ mx: 1 }}>VS</Typography>
                <Box sx={{ minWidth: '80px' }}>
                    {renderCheckboxes(driver2)}
                </Box>
                <Box sx={{ flex: 1 }}>
                    {driverSelect(2, driver2, (e) => {
                        setDriver2(e.target.value);
                        handleUpdate('driver2', e.target.value);
                    })}
                </Box>
            </Box>
        </Paper>
    );
}

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
                    <InputLabel>{`Equipe ${teamNumber}`}</InputLabel>
                    <Select
                        value={value}
                        label={`Equipe ${teamNumber}`}
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
                            label={<Localized id={cat.labelId}><Typography variant="body2"></Typography></Localized>}
                        />
                    ))
                ) : (
                     categories.map(cat => (
                        <Box key={cat.key} sx={{ display: 'flex', alignItems: 'center', height: '30px' }}>
                            <Typography sx={{ mr: 1, width: '20px' }}>{cat.winner === selectedTeamId ? '✔️' : '❌'}</Typography>
                            <Localized id={cat.labelId}><Typography variant="body2"></Typography></Localized>}
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
                <Grid item xs={12} md={2.5}>
                    {teamSelect(1, team1)}
                </Grid>
                <Grid item xs={4} md={2.5}>
                    {renderCheckboxes(team1)}
                </Grid>
                <Grid item xs={4} md={2} sx={{ textAlign: 'center' }}>
                    <Typography>VS</Typography>
                </Grid>
                <Grid item xs={4} md={2.5}>
                    {renderCheckboxes(team2)}
                </Grid>
                <Grid item xs={12} md={2.5}>
                    {teamSelect(2, team2)}
                </Grid>
            </Grid>
        </Paper>
    );
}


function ClashesView({ championshipId, isAdmin, championshipConfig }) {
    const [races, setRaces] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
    const [clashResults, setClashResults] = useState({}); // Object keyed by constructor name
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check if we're in team average mode
    const isTeamAverageMode = championshipConfig?.constructors_ranking_mode === 'team_average';

    // Define constructor pairs for team average mode
    const constructorPairs = [
        { constructor1: 'McLaren', constructor2: 'Red Bull' },
        { constructor1: 'Mercedes', constructor2: 'Ferrari' },
        { constructor1: 'Aston Martin', constructor2: 'Williams' },
        { constructor1: 'VCARB', constructor2: 'Alpine' },
        { constructor1: 'Haas', constructor2: 'Sauber' }
    ];

    const selectedRaceId = races.length > 0 ? races[currentRaceIndex]?.id : '';
    const currentRace = races.length > 0 ? races[currentRaceIndex] : null;

    // Fetch races, attendees, and teams for the selected championship
    useEffect(() => {
        if (!championshipId) return;

        const fetchPrereqs = async () => {
            try {
                const requests = [
                    axiosInstance.get(`/api/championships/${championshipId}/races`),
                    axiosInstance.get(`/api/drivers?championshipId=${championshipId}`)
                ];

                // Add championship attendees request if in team average mode to get teams
                if (isTeamAverageMode) {
                    requests.push(axiosInstance.get(`/api/championship-attendees?championshipId=${championshipId}`));
                }

                const responses = await Promise.all(requests);
                const [racesRes, attendeesRes, championshipAttendeesRes] = responses;

                const fetchedRaces = racesRes.data || [];
                setRaces(fetchedRaces);
                setAttendees(attendeesRes.data || []);
                
                if (isTeamAverageMode && championshipAttendeesRes) {
                    // Get unique teams from championship attendees
                    const attendeesData = championshipAttendeesRes.data || [];
                    const uniqueTeamIds = [...new Set(attendeesData.map(attendee => attendee.team_id).filter(Boolean))];
                    
                    // Create teams array with id and name from the drivers data (attendeesRes)
                    const teamsData = uniqueTeamIds.map(teamId => {
                        const driverWithTeam = attendeesRes.data.find(driver => driver.team_id === teamId);
                        return {
                            id: teamId,
                            name: driverWithTeam?.team_name || `Team ${teamId}`
                        };
                    });
                    
                    setTeams(teamsData);
                }
                
                setCurrentRaceIndex(0); // Reset index
            } catch (err) {
                console.error("Error fetching prerequisites:", err);
                setError("Failed to load races, drivers, or teams.");
            }
        };
        fetchPrereqs();
    }, [championshipId, isTeamAverageMode]);

    // Fetch clash results when a race is selected
    useEffect(() => {
        if (!selectedRaceId) {
            setClashResults({});
            return;
        }
        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await axiosInstance.get(`/api/championships/${championshipId}/races/${selectedRaceId}/clashes`);
                // Convert array from backend to an object keyed by constructor name or pair name for easy lookup
                const resultsMap = (res.data.data || []).reduce((acc, item) => {
                    // For team average mode, use clash_pair_name; for individual mode, use clash_constructor_name
                    const key = item.clash_pair_name || item.clash_constructor_name;
                    acc[key] = item;
                    return acc;
                }, {});
                setClashResults(resultsMap);
            } catch (err) {
                console.error("Error fetching clash results:", err);
                setError('clashes-loading-error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, [selectedRaceId, championshipId]);
    
     const handleUpdateClash = useCallback(async (payload) => {
        if (!selectedRaceId) return;

        try {
            const key = payload.clash_pair_name || payload.clash_constructor_name;
            const currentResult = clashResults[key] || {};
            const finalPayload = { ...currentResult, ...payload };
            
            // When unsetting a driver/team, the ID becomes "", which we want to send as null
            if (finalPayload.driver1_user_id === '') finalPayload.driver1_user_id = null;
            if (finalPayload.driver2_user_id === '') finalPayload.driver2_user_id = null;
            if (finalPayload.team1_id === '') finalPayload.team1_id = null;
            if (finalPayload.team2_id === '') finalPayload.team2_id = null;
            
            await axiosInstance.post(`/api/races/${selectedRaceId}/clashes`, finalPayload);
            // Optimistically update local state
            setClashResults(prev => ({
                ...prev,
                [key]: finalPayload
            }));
        } catch (err) {
            console.error("Failed to save clash data", err);
            setError('clashes-save-error');
            // Note: Consider reverting optimistic update on error
        }
    }, [selectedRaceId, clashResults]);

    const allSelectedDriverIds = useMemo(() => {
        if (isTeamAverageMode) return new Set(); // Not used in team mode
        return new Set(
            Object.values(clashResults).flatMap(result => 
                [result.driver1_user_id, result.driver2_user_id].filter(Boolean)
            )
        );
    }, [clashResults, isTeamAverageMode]);

    const allSelectedTeamIds = useMemo(() => {
        if (!isTeamAverageMode) return new Set(); // Not used in individual mode
        return new Set(
            Object.values(clashResults).flatMap(result => 
                [result.team1_id, result.team2_id].filter(Boolean)
            )
        );
    }, [clashResults, isTeamAverageMode]);
    
    const handlePrevRace = () => {
        setCurrentRaceIndex(prevIndex => (prevIndex - 1 + races.length) % races.length);
    };

    const handleNextRace = () => {
        setCurrentRaceIndex(prevIndex => (prevIndex + 1) % races.length);
    };

    return (
        <Box sx={{ mt: 2 }}>
            {races.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, p:1, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <IconButton onClick={handlePrevRace} disabled={races.length < 2}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    
                    {currentRace && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, textAlign: 'center' }}>
                            <img 
                                src={`https://flagcdn.com/w40/${getCountryCodeForRace(currentRace.title)}.png`} 
                                width="40" 
                                alt={currentRace.title}
                                style={{ marginRight: '10px', display: getCountryCodeForRace(currentRace.title) ? 'block' : 'none' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <Typography variant="h6">{currentRace.title}</Typography>
                        </Box>
                    )}
                    
                    <IconButton onClick={handleNextRace} disabled={races.length < 2}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}><Localized id={error} /></Alert>}
            
            {!selectedRaceId && !isLoading ? (
                <Alert severity="info"><Localized id="clashes-no-race-selected" /></Alert>
            ) : isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
            ) : (
                <Box>
                    {isTeamAverageMode ? (
                        // Team Average Mode: Show constructor pairs with team selections
                        constructorPairs.map(pair => (
                            <ClashPairRow
                                key={`${pair.constructor1}_vs_${pair.constructor2}`}
                                constructorPair={pair}
                                raceData={clashResults[`${pair.constructor1}_vs_${pair.constructor2}`]}
                                teams={teams}
                                allSelectedTeamIds={allSelectedTeamIds}
                                isAdmin={isAdmin}
                                onUpdate={handleUpdateClash}
                            />
                        ))
                    ) : (
                        // Individual Mode: Show individual constructors with driver selections
                        constructorTiers.map(team => (
                        <ClashRow
                            key={team.name}
                            constructorTeam={team}
                            raceData={clashResults[team.name]}
                            attendees={attendees}
                            allSelectedDriverIds={allSelectedDriverIds}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdateClash}
                        />
                        ))
                    )}
                </Box>
            )}
        </Box>
    );
}

export default ClashesView;
