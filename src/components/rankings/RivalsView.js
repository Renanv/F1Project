import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Alert,
    IconButton
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Localized } from '@fluent/react';
import ClashRow from './ClashRow';
import { constructorTiers } from '../../utils/constructors';
import { getCountryCodeForRace } from '../../utils/raceToCountryCode';
import axiosInstance from '../../utils/axiosInstance';

function RivalsView({ championshipId, isAdmin }) {
    const queryClient = useQueryClient();
    const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
    const [clashResults, setClashResults] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch races for the championship
    const { data: races } = useQuery({
        queryKey: ['races', championshipId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/api/championships/${championshipId}/races`);
            return response.data;
        },
        enabled: !!championshipId
    });

    // Fetch drivers (attendees) for the championship
    const { data: attendees } = useQuery({
        queryKey: ['drivers', championshipId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/api/drivers?championshipId=${championshipId}`);
            return response.data;
        },
        enabled: !!championshipId
    });

    // Fetch rivalry clash data for current race
    useEffect(() => {
        const fetchClashData = async () => {
            if (!races || races.length === 0 || !championshipId) return;
            
            const currentRace = races[currentRaceIndex];
            if (!currentRace) return;

            setIsLoading(true);
            setError(null);
            
            try {
                const response = await axiosInstance.get(`/api/championships/${championshipId}/races/${currentRace.id}/rivals`);
                
                const clashData = {};
                response.data.data.forEach(item => {
                    // Map P1 x P2 format back to constructor names for display
                    let constructorName = item.clash_constructor_name;
                    
                    // If it's in P1 x P2 format, map it back to the constructor
                    const pairMatch = constructorName.match(/^P(\d+) x P(\d+)$/);
                    if (pairMatch) {
                        const index = Math.floor((parseInt(pairMatch[1]) - 1) / 2);
                        if (constructorTiers[index]) {
                            constructorName = constructorTiers[index].name;
                        }
                    }
                    
                    clashData[constructorName] = item;
                });
                
                setClashResults(clashData);
            } catch (err) {
                console.error('Error fetching rivalry clash data:', err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClashData();
    }, [currentRaceIndex, races, championshipId]);

    // Get all selected driver IDs for filtering dropdowns
    const allSelectedDriverIds = useMemo(() => {
        const ids = new Set();
        Object.values(clashResults).forEach(data => {
            if (data.driver1_user_id) ids.add(data.driver1_user_id);
            if (data.driver2_user_id) ids.add(data.driver2_user_id);
        });
        return ids;
    }, [clashResults]);

    const handleUpdateClash = async (payload) => {
        if (!races || races.length === 0) return;
        
        const currentRace = races[currentRaceIndex];
        if (!currentRace) return;

        try {
            // Add is_rival flag to payload
            const rivalPayload = { ...payload, is_rival: true };
            
            
            await axiosInstance.post(`/api/races/${currentRace.id}/clashes`, rivalPayload);
            
            // Update local state optimistically
            setClashResults(prev => ({
                ...prev,
                [payload.clash_constructor_name]: rivalPayload
            }));
            
        } catch (error) {
            console.error('Error updating rivalry clash:', error);
        }
    };

    if (!races || races.length === 0) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                <Localized id="clashes-no-race-selected" fallback="Please select a race to see the clash results." />
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                <Localized id="clashes-loading-error" fallback="An error occurred while loading the clash data." />
            </Alert>
        );
    }

    const handlePrevRace = () => {
        setCurrentRaceIndex(prevIndex => (prevIndex - 1 + races.length) % races.length);
    };

    const handleNextRace = () => {
        setCurrentRaceIndex(prevIndex => (prevIndex + 1) % races.length);
    };

    const currentRace = races && races[currentRaceIndex];

    return (
        <Box sx={{ mt: 2 }}>
            {races && races.length > 0 && (
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

            {/* Rivalry Clashes - EXACTLY like Individual mode */}
            <Box>
                {constructorTiers.map(constructorTeam => {
                    const raceData = clashResults[constructorTeam.name];
                    
                    return (
                        <ClashRow
                            key={constructorTeam.name}
                            constructorTeam={constructorTeam}
                            raceData={raceData}
                            attendees={attendees || []}
                            allSelectedDriverIds={allSelectedDriverIds}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdateClash}
                            hideConstructorName={true}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

export default RivalsView;
