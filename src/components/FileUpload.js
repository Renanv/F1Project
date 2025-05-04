import React, { useState } from 'react';
import { Localized } from '@fluent/react';
import { Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { handleFileUpload } from '../utils/fileUploadHandler';

const FileUpload = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleFileUpload(file, setMessage, setLoading, onSuccess)}
        disabled={loading || !file}
        startIcon={loading && <CircularProgress size={20} />}
      >
        <Localized id={loading ? "processing" : "upload-and-process"} />
      </Button>
      {message && (
        <Alert severity={message === 'file-processed-success' ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Localized id={message} />
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 