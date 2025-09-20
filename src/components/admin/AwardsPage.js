import React, { useState, useEffect } from 'react';
import { Localized } from '@fluent/react';
import {
    Container, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Box, Grid, Card, CardContent,
    CircularProgress, Alert, useTheme, useMediaQuery, Avatar, Chip, Divider
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import axiosInstance from '../../utils/axiosInstance';
import { getCountryCodeForRace } from '../../utils/raceToCountryCode';

const Flag = ({ countryCode, raceName }) => {
    // Special case for "Surpresa" races
    if (raceName && raceName.toLowerCase().includes('surpresa')) {
        return (
            <Box sx={{
                width: '32px',
                height: '24px',
                backgroundColor: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                mr: 1
            }}>
                ?
            </Box>
        );
    }

    if (countryCode) {
        return (
            <img
                src={`https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`}
                alt={raceName}
                style={{ width: '32px', height: '24px', marginRight: '8px' }}
            />
        );
    }

    return null;
};

const TrophyIcon = ({ position, size = 'large' }) => {
    const colors = {
        1: '#FFD700', // Gold
        2: '#C0C0C0', // Silver
        3: '#CD7F32'  // Bronze
    };

    const sizes = {
        small: { width: 32, height: 32, fontSize: '1rem' },
        medium: { width: 48, height: 48, fontSize: '1.5rem' },
        large: { width: 64, height: 64, fontSize: '2rem' }
    };

    return (
        <Box sx={{
            ...sizes[size],
            backgroundColor: colors[position],
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 3,
            border: '3px solid white'
        }}>
            <EmojiEventsIcon sx={{ 
                color: position === 2 ? '#000' : '#fff', 
                fontSize: sizes[size].fontSize 
            }} />
        </Box>
    );
};

const PodiumCard = ({ race, podiumData, drivers }) => {
    const theme = useTheme();
    const countryCode = getCountryCodeForRace(race.title);

    // Get driver info for each position
    const getDriverInfo = (position) => {
        const result = podiumData.find(r => r.position === position);
        if (!result) return null;
        
        const driver = drivers.find(d => d.user_id === result.user_id);
        return driver ? {
            name: driver.name,
            driverNumber: driver.driver_number,
            teamName: driver.team_name
        } : null;
    };

    const firstPlace = getDriverInfo(1);
    const secondPlace = getDriverInfo(2);
    const thirdPlace = getDriverInfo(3);

    return (
        <Card sx={{ mb: 3, overflow: 'visible' }} elevation={3}>
            <CardContent sx={{ p: 3 }}>
                {/* Race Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Flag countryCode={countryCode} raceName={race.title} />
                    <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
                        {race.title}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Podium Display */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 4, mb: 3 }}>
                    {/* 2nd Place */}
                    {secondPlace && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <TrophyIcon position={2} size="medium" />
                            <Box sx={{ 
                                mt: 1, 
                                p: 2, 
                                backgroundColor: 'white', 
                                borderRadius: 2, 
                                width: 180,
                                minHeight: 140,
                                textAlign: 'center',
                                border: '2px solid #C0C0C0',
                                boxShadow: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                                        2nd
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000' }}>
                                        {secondPlace.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                        #{secondPlace.driverNumber}
                                    </Typography>
                                </Box>
                                <Box sx={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {secondPlace.teamName ? (
                                        <Chip 
                                            label={secondPlace.teamName} 
                                            size="small" 
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                backgroundColor: '#C0C0C0',
                                                color: '#000'
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ height: '24px' }} /> // Placeholder to maintain height
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* 1st Place (Elevated) */}
                    {firstPlace && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <TrophyIcon position={1} size="large" />
                            <Box sx={{ 
                                mt: 1, 
                                p: 3, 
                                backgroundColor: 'white',
                                borderRadius: 2, 
                                width: 200,
                                minHeight: 160,
                                textAlign: 'center',
                                border: '3px solid #FFD700',
                                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#B8860B', mb: 1 }}>
                                        1st
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000' }}>
                                        {firstPlace.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                        #{firstPlace.driverNumber}
                                    </Typography>
                                </Box>
                                <Box sx={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {firstPlace.teamName ? (
                                        <Chip 
                                            label={firstPlace.teamName} 
                                            size="small" 
                                            sx={{ 
                                                fontSize: '0.75rem', 
                                                backgroundColor: '#FFD700', 
                                                color: '#000',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ height: '24px' }} /> // Placeholder to maintain height
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* 3rd Place */}
                    {thirdPlace && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <TrophyIcon position={3} size="small" />
                            <Box sx={{ 
                                mt: 1, 
                                p: 2, 
                                backgroundColor: 'white', 
                                borderRadius: 2, 
                                width: 180,
                                minHeight: 140,
                                textAlign: 'center',
                                border: '2px solid #CD7F32',
                                boxShadow: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8B4513', mb: 1 }}>
                                        3rd
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000' }}>
                                        {thirdPlace.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                        #{thirdPlace.driverNumber}
                                    </Typography>
                                </Box>
                                <Box sx={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {thirdPlace.teamName ? (
                                        <Chip 
                                            label={thirdPlace.teamName} 
                                            size="small" 
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                backgroundColor: '#CD7F32',
                                                color: '#fff'
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ height: '24px' }} /> // Placeholder to maintain height
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* No Podium Message */}
                {!firstPlace && !secondPlace && !thirdPlace && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            <Localized id="no-podium-data" fallback="No podium data available for this race" />
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

const AwardsPage = () => {
    const [championships, setChampionships] = useState([]);
    const [selectedChampionshipId, setSelectedChampionshipId] = useState('');
    const [races, setRaces] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [raceResults, setRaceResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Fetch championships on component mount
    useEffect(() => {
        const fetchChampionships = async () => {
            try {
                // Use groupByStatus to get structured data and includeHidden for admin access
                const response = await axiosInstance.get('/api/championships?groupByStatus=true&includeHidden=true');
                
                // Process grouped data into a flat list, prioritizing RUNNING championships
                let championshipsList = [];
                if (response.data.grouped) {
                    const statusOrder = ['RUNNING', 'FINISHED', 'REGISTERING', 'HIDDEN'];
                    statusOrder.forEach(status => {
                        if (response.data.data[status]) {
                            championshipsList.push(...response.data.data[status]);
                        }
                    });
                } else {
                    championshipsList = response.data;
                }
                
                setChampionships(championshipsList);
                if (championshipsList.length > 0) {
                    setSelectedChampionshipId(championshipsList[0].id);
                }
            } catch (err) {
                setError('Failed to fetch championships');
                console.error('Error fetching championships:', err);
            }
        };

        fetchChampionships();
    }, []);

    // Fetch championship data when selection changes
    useEffect(() => {
        if (!selectedChampionshipId) return;

        const fetchChampionshipData = async () => {
            setLoading(true);
            setError('');

            try {
                // Fetch races, drivers, and race results in parallel
                const [racesResponse, driversResponse, resultsResponse] = await Promise.all([
                    axiosInstance.get(`/api/championships/${selectedChampionshipId}/races`),
                    axiosInstance.get(`/api/drivers?championshipId=${selectedChampionshipId}`),
                    axiosInstance.get(`/api/championships/${selectedChampionshipId}/points-by-race`)
                ]);

                setRaces(racesResponse.data);
                setDrivers(driversResponse.data);

                // Process race results to get podium data
                if (resultsResponse.data.success) {
                    const { races: raceList, driverRankings } = resultsResponse.data.data;
                    const podiumByRace = {};

                    raceList.forEach(race => {
                        const raceResultsData = [];
                        
                        driverRankings.forEach(ranking => {
                            const racePoints = ranking.racePoints[race.id];
                            if (racePoints !== null && racePoints !== 'DNF') {
                                // Estimate position from points (this is approximate)
                                let position = null;
                                if (racePoints >= 25) position = 1;
                                else if (racePoints >= 18) position = 2;
                                else if (racePoints >= 15) position = 3;

                                if (position) {
                                    raceResultsData.push({
                                        user_id: ranking.driverInfo.userId,
                                        position: position,
                                        points: racePoints
                                    });
                                }
                            }
                        });

                        // Sort by position to ensure correct podium order
                        raceResultsData.sort((a, b) => a.position - b.position);
                        podiumByRace[race.id] = raceResultsData;
                    });

                    setRaceResults(podiumByRace);
                }
            } catch (err) {
                setError('Failed to fetch championship data');
                console.error('Error fetching championship data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChampionshipData();
    }, [selectedChampionshipId]);

    const handleChampionshipChange = (event) => {
        setSelectedChampionshipId(event.target.value);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <EmojiEventsIcon sx={{ fontSize: 40, mr: 2, color: '#FFD700' }} />
                <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                    <Localized id="awards-page-title" fallback="Awards" />
                </Typography>
            </Box>

            {/* Championship Selector */}
            <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
                <FormControl fullWidth>
                    <InputLabel id="championship-select-label">
                        <Localized id="select-championship-label" fallback="Select Championship" />
                    </InputLabel>
                    <Select
                        labelId="championship-select-label"
                        value={selectedChampionshipId}
                        label="Select Championship"
                        onChange={handleChampionshipChange}
                        disabled={loading}
                    >
                        {championships.map((championship) => (
                            <MenuItem key={championship.id} value={championship.id}>
                                {championship.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            {/* Awards Display */}
            {!loading && !error && races.length > 0 && (
                <Box>
                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                        <Localized id="podium-awards-title" fallback="Podium Awards" />
                    </Typography>
                    
                    {races.map(race => (
                        <PodiumCard
                            key={race.id}
                            race={race}
                            podiumData={raceResults[race.id] || []}
                            drivers={drivers}
                        />
                    ))}
                </Box>
            )}

            {/* No Data State */}
            {!loading && !error && races.length === 0 && selectedChampionshipId && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        <Localized id="no-races-in-championship" fallback="No races found in this championship" />
                    </Typography>
                </Paper>
            )}
        </Container>
    );
};

export default AwardsPage;