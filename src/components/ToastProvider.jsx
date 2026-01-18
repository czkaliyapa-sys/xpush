/**
 * Toast Notification System
 * Provides consistent user feedback across all components
 */

import { Snackbar, Alert } from '@mui/material';
import { useState, createContext, useContext, useCallback } from 'react';

// Toast context for global access
const ToastContext = createContext();

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info', // success, error, warning, info
    duration: 6000
  });

  const showToast = useCallback((message, severity = 'info', duration = 6000) => {
    setToast({
      open: true,
      message,
      severity,
      duration
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  // Convenience methods
  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showWarning = useCallback((message) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ 
      showToast, 
      hideToast, 
      showError, 
      showSuccess, 
      showWarning, 
      showInfo 
    }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={hideToast}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: 3,
            '& .MuiAlert-message': {
              fontWeight: 500
            }
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

// Hook to use toast notifications
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Default export
export default ToastProvider;