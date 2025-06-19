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

// A single clash row, representing one constructor team vs itself
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
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3.5}>
                    {driverSelect(1, driver1, (e) => {
                        setDriver1(e.target.value);
                        handleUpdate('driver1', e.target.value);
                    })}
                </Grid>
                <Grid item xs={5} md={2.5}>
                    {renderCheckboxes(driver1)}
                </Grid>
                <Grid item xs={2} md={1} sx={{ textAlign: 'center' }}>
                    <Typography>VS</Typography>
                </Grid>
                <Grid item xs={5} md={2.5}>
                    {renderCheckboxes(driver2)}
                </Grid>
                <Grid item xs={12} md={2.5}>
                     {driverSelect(2, driver2, (e) => {
                        setDriver2(e.target.value);
                        handleUpdate('driver2', e.target.value);
                    })}
                </Grid>
            </Grid>
        </Paper>
    );
}


function ClashesView({ championshipId, isAdmin }) {
    const [races, setRaces] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
    const [clashResults, setClashResults] = useState({}); // Object keyed by constructor name
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const selectedRaceId = races.length > 0 ? races[currentRaceIndex]?.id : '';
    const currentRace = races.length > 0 ? races[currentRaceIndex] : null;

    // Fetch races and attendees for the selected championship
    useEffect(() => {
        if (!championshipId) return;

        const fetchPrereqs = async () => {
            try {
                const [racesRes, attendeesRes] = await Promise.all([
                    axiosInstance.get(`/api/championships/${championshipId}/races`),
                    axiosInstance.get(`/api/drivers?championshipId=${championshipId}`)
                ]);
                const fetchedRaces = racesRes.data || [];
                setRaces(fetchedRaces);
                setAttendees(attendeesRes.data || []);
                setCurrentRaceIndex(0); // Reset index
            } catch (err) {
                console.error("Error fetching prerequisites:", err);
                setError("Failed to load races or drivers.");
            }
        };
        fetchPrereqs();
    }, [championshipId]);

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
                // Convert array from backend to an object keyed by constructor name for easy lookup
                const resultsMap = (res.data.data || []).reduce((acc, item) => {
                    acc[item.clash_constructor_name] = item;
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
            const currentResult = clashResults[payload.clash_constructor_name] || {};
            const finalPayload = { ...currentResult, ...payload };
            
            // When unsetting a driver, the ID becomes "", which we want to send as null
            if (finalPayload.driver1_user_id === '') finalPayload.driver1_user_id = null;
            if (finalPayload.driver2_user_id === '') finalPayload.driver2_user_id = null;
            
            await axiosInstance.post(`/api/races/${selectedRaceId}/clashes`, finalPayload);
            // Optimistically update local state
            setClashResults(prev => ({
                ...prev,
                [payload.clash_constructor_name]: finalPayload
            }));
        } catch (err) {
            console.error("Failed to save clash data", err);
            setError('clashes-save-error');
            // Note: Consider reverting optimistic update on error
        }
    }, [selectedRaceId, clashResults]);

    const allSelectedDriverIds = useMemo(() => {
        return new Set(
            Object.values(clashResults).flatMap(result => 
                [result.driver1_user_id, result.driver2_user_id].filter(Boolean)
            )
        );
    }, [clashResults]);
    
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
                    {constructorTiers.map(team => (
                        <ClashRow
                            key={team.name}
                            constructorTeam={team}
                            raceData={clashResults[team.name]}
                            attendees={attendees}
                            allSelectedDriverIds={allSelectedDriverIds}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdateClash}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default ClashesView; 