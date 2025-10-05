import React, { createContext, useContext, useState, useMemo } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const ToastContext = createContext({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }) {
  const [state, setState] = useState({ open: false, severity: 'info', messageId: null });

  const api = useMemo(() => ({
    show: (severity, messageId) => setState({ open: true, severity, messageId }),
  }), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={state.open}
        onClose={() => setState(s => ({ ...s, open: false }))}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={state.severity}
          variant="filled"
          onClose={() => setState(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {state.messageId}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}


