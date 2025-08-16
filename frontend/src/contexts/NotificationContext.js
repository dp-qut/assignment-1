import React, { createContext, useContext, useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  const showNotification = (message, severity = 'info', duration = 6000) => {
    const notification = {
      id: Date.now(),
      message,
      severity,
      duration,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(notification.id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, duration) => {
    showNotification(message, 'success', duration);
  };

  const showError = (message, duration) => {
    showNotification(message, 'error', duration);
  };

  const showWarning = (message, duration) => {
    showNotification(message, 'warning', duration);
  };

  const showInfo = (message, duration) => {
    showNotification(message, 'info', duration);
  };

  useEffect(() => {
    if (notifications.length > 0 && !open) {
      setCurrentNotification(notifications[0]);
      setOpen(true);
    } else if (notifications.length === 0 && open) {
      setOpen(false);
      setCurrentNotification(null);
    }
  }, [notifications, open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    if (currentNotification) {
      removeNotification(currentNotification.id);
    }
  };

  const value = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={currentNotification?.duration || 6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={currentNotification?.severity || 'info'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {currentNotification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
