import React, { useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Localized } from '@fluent/react';

export default function OnlineToastController() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
    };
    window.addEventListener('app-back-online', handler);
    return () => window.removeEventListener('app-back-online', handler);
  }, []);

  return (
    <Snackbar
      open={open}
      onClose={() => setOpen(false)}
      autoHideDuration={2500}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" variant="filled" onClose={() => setOpen(false)}>
        <Localized id="back-online" fallback="Back online" />
      </Alert>
    </Snackbar>
  );
}


