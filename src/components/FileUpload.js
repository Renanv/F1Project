import React, { useState } from 'react';
import { Localized } from '@fluent/react';
import { Button, Typography, Box, CircularProgress, Alert, FormControlLabel, Checkbox } from '@mui/material';
import { handleFileUpload } from '../utils/fileUploadHandler';
import { useToast } from './ToastProvider';

const FileUpload = ({ onSuccess, selectedRaceId, isAdmin }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useMultiplier, setUseMultiplier] = useState(false);
  const toast = useToast();

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        <Localized id="upload-race-data" />
      </Typography>
      <input
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button variant="contained" component="span" sx={{ mb: 2 }}>
          <Localized id="select-file" />
        </Button>
      </label>
      {file && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {file.name}
        </Typography>
      )}
      <FormControlLabel
        control={
          <Checkbox
            checked={useMultiplier}
            onChange={(e) => setUseMultiplier(e.target.checked)}
            color="primary"
          />
        }
        label={<Localized id="race-points-multiplier-label" />}
        sx={{ mb: 2, display: 'block' }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleFileUpload(file, setMessage, setLoading, onSuccess, selectedRaceId, useMultiplier)}
        disabled={loading || !file || !selectedRaceId}
        startIcon={loading && <CircularProgress size={20} />}
      >
        <Localized id={loading ? "processing" : "upload-and-process"} />
      </Button>
      {message && (() => { toast.show(message === 'file-processed-success' ? 'success' : 'error', <Localized id={message} />); return null; })()}
    </Box>
  );
};

export default FileUpload; 