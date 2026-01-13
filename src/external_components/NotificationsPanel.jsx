import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: 12,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'white'
}));

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.uid]);

  const loadNotifications = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await notificationsAPI.getUserNotifications(user.uid);
      
      if (response?.success && Array.isArray(response.notifications)) {
        setNotifications(response.notifications);
        setUnreadCount(response.notifications.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_submitted':
      case 'application_approved':
        return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
      case 'application_denied':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'documents_requested':
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'application_under_review':
        return <AssignmentTurnedInIcon sx={{ color: '#2196F3' }} />;
      default:
        return <InfoIcon sx={{ color: '#48CEDB' }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'application_approved':
        return 'rgba(76, 175, 80, 0.1)';
      case 'application_denied':
        return 'rgba(244, 67, 54, 0.1)';
      case 'documents_requested':
        return 'rgba(255, 152, 0, 0.1)';
      default:
        return 'rgba(72, 206, 219, 0.1)';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          color: 'white',
          '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.1)' }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
        </Badge>
      </IconButton>

      {/* Notifications Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            bgcolor: '#0d2137',
            color: 'white'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon sx={{ color: '#48CEDB' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                sx={{
                  bgcolor: '#48CEDB',
                  color: '#0f172a',
                  fontWeight: 600,
                  height: 20,
                  minWidth: 20
                }}
              />
            )}
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Loading State */}
        {loading && notifications.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#48CEDB' }} />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && !error && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No notifications yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
              We'll notify you about application updates
            </Typography>
          </Box>
        )}

        {/* Notifications List */}
        <List sx={{ p: 0 }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  bgcolor: notification.is_read ? 'transparent' : getNotificationColor(notification.notification_type),
                  '&:hover': { bgcolor: 'rgba(72, 206, 219, 0.05)' },
                  py: 2,
                  cursor: 'pointer'
                }}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'transparent', border: '2px solid rgba(72, 206, 219, 0.3)' }}>
                    {getNotificationIcon(notification.notification_type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {formatTimestamp(notification.created_at)}
                        </Typography>
                        {!notification.is_read && (
                          <Chip
                            label="New"
                            size="small"
                            sx={{
                              bgcolor: '#48CEDB',
                              color: '#0f172a',
                              fontWeight: 600,
                              height: 18,
                              fontSize: '0.65rem'
                            }}
                          />
                        )}
                      </Box>
                    </>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}
            </React.Fragment>
          ))}
        </List>

        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={async () => {
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
                await Promise.all(unreadIds.map(id => handleMarkAsRead(id)));
              }}
              sx={{
                color: '#48CEDB',
                borderColor: 'rgba(72, 206, 219, 0.5)',
                '&:hover': { borderColor: '#48CEDB', bgcolor: 'rgba(72, 206, 219, 0.1)' }
              }}
            >
              Mark All as Read
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
};

export default NotificationsPanel;
