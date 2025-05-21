import React, { useState } from 'react';
import { Localized } from '@fluent/react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance';

// Updated Judgment options for juror submission
const jurorJudgmentOptions = {
    'SP': { labelId: 'judgment-option-sp', fallback: 'Stop and Go Penalty (SP)' },
    'L': { labelId: 'judgment-option-l', fallback: 'Light Penalty (L)' },
    'M': { labelId: 'judgment-option-m', fallback: 'Medium Penalty (M)' },
    'G': { labelId: 'judgment-option-g', fallback: 'Grid Penalty (G)' },
};

export default function SubmitJudgmentForm({ penaltyId, assignedSlot, currentAccusedUserTag, onJudgmentSubmitted }) {
  const [judgment, setJudgment] = useState('');
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newJudgment) => 
      axiosInstance.post(`/api/jury/penalties/${penaltyId}/judgment`, newJudgment),
    onSuccess: (data) => {
      setFormError('');
      queryClient.invalidateQueries(['penaltyDetails', penaltyId]);
      queryClient.invalidateQueries(['assignedPenalties']); // For MyJuryTasksPage
      if (onJudgmentSubmitted) {
        onJudgmentSubmitted(data?.data?.message || 'Judgment submitted successfully.');
      }
      setJudgment('');
    },
    onError: (error) => {
      setFormError(error.response?.data?.message || 'Failed to submit judgment.');
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');
    if (!judgment) {
      setFormError('Please select a judgment.');
      return;
    }
    mutation.mutate({ judgment, jurySlot: assignedSlot });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'info.main', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        <Localized id="submit-judgment-title" vars={{ assignedSlot: assignedSlot, userTag: currentAccusedUserTag }} fallback={`Submit Your Judgment (Slot: ${assignedSlot}) for ${currentAccusedUserTag}`} />
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!formError && !judgment}>
            <InputLabel id="judgment-select-label"><Localized id="judgment-label" fallback="Judgment" /></InputLabel>
            <Select
              labelId="judgment-select-label"
              value={judgment}
              label={<Localized id="judgment-label" fallback="Judgment" />}
              onChange={(e) => setJudgment(e.target.value)}
            >
              <MenuItem value="">
                <em><Localized id="select-judgment-placeholder" fallback="Select a Judgment..." /></em>
              </MenuItem>
              {Object.entries(jurorJudgmentOptions).map(([key, opt]) => (
                <MenuItem key={key} value={key}>
                  <Localized id={opt.labelId} fallback={opt.fallback} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
      
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        sx={{ mt: 3 }} 
        disabled={mutation.isLoading}
      >
        {mutation.isLoading ? <CircularProgress size={24}/> : <Localized id="submit-judgment-button" fallback="Submit Judgment" />}
      </Button>
    </Box>
  );
} 