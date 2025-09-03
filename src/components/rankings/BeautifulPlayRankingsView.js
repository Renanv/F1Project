import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Localized } from '@fluent/react';

const BeautifulPlayRankingsView = ({ beautifulPlayData, isMobile }) => {
  const theme = useTheme();

  if (!beautifulPlayData || beautifulPlayData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          <Localized id="no-beautiful-play-data" />
        </Typography>
      </Box>
    );
  }

  const renderBeautifulPlayCard = (driver, index) => (
    <Card key={driver.user_id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {index + 1}
            </Typography>
            <Typography variant="h6">
              {driver.name} #{driver.driver_number}
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {driver.total_beautiful_play_points} pts
          </Typography>
        </Box>


        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">
              <Localized id="beautiful-play-breakdown" />
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  <Localized id="switchback-plays" />:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {driver.switchback_count} × 1pt = {driver.switchback_count}pts
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  <Localized id="double-overtake-plays" />:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {driver.double_overtake_count} × 1pt = {driver.double_overtake_count}pts
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  <Localized id="triple-overtake-plays" />:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {driver.triple_overtake_count} × 2pts = {driver.triple_overtake_count * 2}pts
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );

  const renderBeautifulPlayTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>
              <Localized id="driver-position" />
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>
              <Localized id="driver" />
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              <Localized id="switchback-short" />
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              <Localized id="double-overtake-short" />
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              <Localized id="triple-overtake-short" />
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              <Localized id="total-points" />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {beautifulPlayData.map((driver, index) => (
            <TableRow 
              key={driver.user_id}
              sx={{ 
                '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                '&:hover': { backgroundColor: 'action.selected' }
              }}
            >
              <TableCell>
                <Typography>
                  {index + 1}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography>
                  {driver.name} #{driver.driver_number}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>
                  {driver.switchback_count}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>
                  {driver.double_overtake_count}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography>
                  {driver.triple_overtake_count}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
                  {driver.total_beautiful_play_points}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          <Localized id="beautiful-play-description" />
        </Typography>
      </Box>
      
      {isMobile ? (
        <Box>
          {beautifulPlayData.map((driver, index) => renderBeautifulPlayCard(driver, index))}
        </Box>
      ) : (
        renderBeautifulPlayTable()
      )}
    </Box>
  );
};

export default BeautifulPlayRankingsView;