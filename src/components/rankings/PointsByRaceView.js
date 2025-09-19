import React, { useState, useEffect } from 'react';
import { Localized } from '@fluent/react';
import {
    Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    CircularProgress, Alert, useTheme, useMediaQuery, Box, Card, CardContent, Grid, Accordion, AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axiosInstance from '../../utils/axiosInstance';
import { getCountryCodeForRace } from '../../utils/raceToCountryCode';

const Flag = ({ countryCode, raceName }) => (
    <Tooltip title={raceName}>
        <img
            src={`https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`}
            alt={raceName}
            style={{ width: '32px', height: '24px', verticalAlign: 'middle' }}
        />
    </Tooltip>
);

const PointsByRaceView = ({ championshipId }) => {
    const [pointsByRaceData, setPointsByRaceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (!championshipId) {
            setLoading(false);
            setError("Championship ID is required.");
            return;
        }

        const fetchPointsByRace = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                const response = await axiosInstance.get(`/api/championships/${championshipId}/points-by-race`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setPointsByRaceData(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch points by race data.');
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'An error occurred while fetching data.');
                console.error("Error fetching points by race:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPointsByRace();
    }, [championshipId]);

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!pointsByRaceData || pointsByRaceData.driverRankings.length === 0) {
        return <Typography sx={{ mt: 2 }}><Localized id="no-rankings-found" /></Typography>;
    }

    const { races, driverRankings } = pointsByRaceData;

    const renderDesktopView = () => (
        <TableContainer component={Paper}>
            <Table stickyHeader aria-label="points by race table">
                <TableHead>
                    <TableRow>
                        <TableCell><Localized id="driver-position" /></TableCell>
                        <TableCell><Localized id="driver-name" /></TableCell>
                        <TableCell><Localized id="driver-team" /></TableCell>
                        {races.map(race => {
                            const countryCode = getCountryCodeForRace(race.title);
                            return (
                                <TableCell key={race.id} align="center">
                                    {countryCode ? <Flag countryCode={countryCode} raceName={race.title} /> : race.title}
                                </TableCell>
                            );
                        })}
                        <TableCell align="center"><Localized id="total-race-points" fallback="Total Race Points" /></TableCell>
                        <TableCell align="center"><Localized id="bonus-points" fallback="Bonus" /></TableCell>
                        <TableCell align="center"><Localized id="total-points" fallback="Total" /></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {driverRankings.map((ranking, index) => (
                        <TableRow hover key={ranking.driverInfo.userId}>
                            <TableCell component="th" scope="row">{index + 1}</TableCell>
                            <TableCell>{ranking.driverInfo.name}</TableCell>
                            <TableCell>{ranking.driverInfo.team_name || 'N/A'}</TableCell>
                            {races.map(race => {
                                const raceData = ranking.racePoints[race.id];
                                // Handle both old format (just points) and new format (object with points and position)
                                const displayValue = raceData !== null ? 
                                    (typeof raceData === 'object' && raceData !== null ? raceData.points : raceData) 
                                    : '—';
                                
                                return (
                                    <TableCell key={`${ranking.driverInfo.userId}-${race.id}`} align="center">
                                        {displayValue}
                                    </TableCell>
                                );
                            })}
                            <TableCell align="center">{ranking.totalPointsFromRaces}</TableCell>
                            <TableCell align="center">{ranking.bonusPoints}</TableCell>
                            <TableCell align="center">{ranking.totalPoints}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderMobileView = () => (
        <Grid container spacing={2}>
            {driverRankings.map((ranking, index) => (
                <Grid item xs={12} key={ranking.driverInfo.userId}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <Typography variant="h6">{`${index + 1}. ${ranking.driverInfo.name}`}</Typography>
                                <Typography variant="h5">{ranking.totalPoints} <Localized id="pts" fallback="pts" /></Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {ranking.driverInfo.team_name || 'N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2"><Localized id="total-race-points" fallback="Race Points"/>: {ranking.totalPointsFromRaces}</Typography>
                                <Typography variant="body2"><Localized id="bonus-points" fallback="Bonus"/>: {ranking.bonusPoints}</Typography>
                            </Box>
                            <Accordion sx={{ mt: 2, boxShadow: 'none', '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="body2"><Localized id="show-race-details" fallback="Show Race Details"/></Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><Localized id="race" fallback="Race"/></TableCell>
                                                <TableCell align="right"><Localized id="points" fallback="Points"/></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {races.map(race => (
                                                <TableRow key={`${ranking.driverInfo.userId}-${race.id}-mobile`}>
                                                    <TableCell>
                                                        {getCountryCodeForRace(race.title) ? <Flag countryCode={getCountryCodeForRace(race.title)} raceName={race.title} /> : race.title}
                                                    </TableCell>
                                                    <TableCell align="right">{ranking.racePoints[race.id] !== null ? ranking.racePoints[race.id] : '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionDetails>
                            </Accordion>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    return isMobile ? renderMobileView() : renderDesktopView();
};

export default PointsByRaceView;