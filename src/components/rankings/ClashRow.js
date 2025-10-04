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

export default ClashRow;
