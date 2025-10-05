import React from 'react';
import { Box, Typography } from '@mui/material';
import { Localized } from '@fluent/react';

export default function AdminHero({ titleId, descriptionId }) {
  return (
    <Box sx={{
      mb: 3,
      p: 2,
      borderRadius: 2,
      background: 'linear-gradient(90deg, rgba(225,6,0,0.18) 0%, rgba(0,210,190,0.12) 100%)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <Localized id={titleId} />
      </Typography>
      {descriptionId && (
        <Typography variant="body1" color="text.secondary">
          <Localized id={descriptionId} />
        </Typography>
      )}
    </Box>
  );
}


