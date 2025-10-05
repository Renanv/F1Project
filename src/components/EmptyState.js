import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Localized } from '@fluent/react';

export default function EmptyState({ icon = <InfoOutlinedIcon />, titleId, messageId, actionLabelId, onAction }) {
  return (
    <Box sx={{
      p: 3,
      borderRadius: 2,
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: 'info.main' }}>{icon}</Box>
        {titleId && (
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            <Localized id={titleId} />
          </Typography>
        )}
      </Box>
      {messageId && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: onAction ? 2 : 0 }}>
          <Localized id={messageId} />
        </Typography>
      )}
      {onAction && (
        <Button variant="contained" color="primary" size="small" onClick={onAction} sx={{ mt: 1 }}>
          <Localized id={actionLabelId} />
        </Button>
      )}
    </Box>
  );
}


