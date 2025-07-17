import React, { useState } from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Typography, CircularProgress, Alert } from '@mui/material';
import { Localized } from '@fluent/react';
import axiosInstance from '../utils/axiosInstance';

function SubmissionForm({ onSubmissionSuccess }) {
    const [type, setType] = useState('CHANNEL');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleTypeChange = (event) => {
        setType(event.target.value);
        setCategory(''); // Reset category when type changes
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|twitch\.tv)\/.+/)) {
            setError('submission-error-url');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                url,
                type,
                ...(type === 'VIDEO' && { category }),
            };
            await axiosInstance.post('/api/community-submissions', payload);
            setSuccess('submission-success-message');
            setUrl('');
            setCategory('');
            setType('CHANNEL');
            if (onSubmissionSuccess) {
                onSubmissionSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'submission-error-message');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ my: 4 }}>
            <Typography variant="h6" gutterBottom>
                <Localized id="submission-form-title" />
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}><Localized id={error} /></Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}><Localized id={success} /></Alert>}

            <FormControl fullWidth margin="normal">
                <InputLabel id="submission-type-label"><Localized id="submission-type-label" /></InputLabel>
                <Select
                    labelId="submission-type-label"
                    value={type}
                    label={<Localized id="submission-type-label" />}
                    onChange={handleTypeChange}
                >
                    <MenuItem value="CHANNEL"><Localized id="submission-type-channel" /></MenuItem>
                    <MenuItem value="VIDEO"><Localized id="submission-type-video" /></MenuItem>
                </Select>
            </FormControl>

            <TextField
                fullWidth
                margin="normal"
                label={<Localized id="submission-url-label" />}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
            />

            {type === 'VIDEO' && (
                <FormControl fullWidth margin="normal" required>
                    <InputLabel id="video-category-label"><Localized id="submission-category-label" /></InputLabel>
                    <Select
                        labelId="video-category-label"
                        value={category}
                        label={<Localized id="submission-category-label" />}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <MenuItem value="LIVE"><Localized id="submission-category-live" /></MenuItem>
                        <MenuItem value="SWITCHBACK"><Localized id="submission-category-switchback" /></MenuItem>
                        <MenuItem value="DOUBLE_OVERTAKE"><Localized id="submission-category-double-overtake" /></MenuItem>
                        <MenuItem value="TRIPLE_OVERTAKE"><Localized id="submission-category-triple-overtake" /></MenuItem>
                    </Select>
                </FormControl>
            )}

            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ mt: 2 }}
            >
                <Localized id="submission-submit-button" />
            </Button>
        </Box>
    );
}

export default SubmissionForm; 