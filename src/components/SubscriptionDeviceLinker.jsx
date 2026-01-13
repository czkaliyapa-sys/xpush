/**
 * SubscriptionDeviceLinker Component
 * 
 * Manages device linking for XtraPush Plus/Premium subscriptions.
 * Allows users to link their subscription to specific devices.
 * Includes smart suggestions for recent devices.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Grid,
  Avatar
} from '@mui/material';
import {
  Link as LinkIcon,
  Smartphone as SmartphoneIcon,
  Laptop as LaptopIcon,
  PhoneAndroid as TabletIcon,
  Check as CheckIcon,
  AccessTime as AccessTimeIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  linkDeviceToSubscription,
  getLinkedDevice,
  getRecentDevicesForLinking
} from '../services/paymentService.js';

const SubscriptionDeviceLinker = ({
  open = false,
  onClose = () => {},
  onLinkSuccess = () => {},
  deviceIdToLink = null, // Optional: pre-select a device
  linkedBy = 'MANUAL' // 'MANUAL', 'AUTO_CHECKOUT', 'AUTO_RECENT'
}) => {
  const { user } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [recentDevices, setRecentDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [linkedDevice, setLinkedDevice] = useState(null);

  useEffect(() => {
    if (open && user?.uid) {
      loadDeviceInfo();
    }
  }, [open, user?.uid]);

  useEffect(() => {
    if (deviceIdToLink && recentDevices.length > 0) {
      const device = recentDevices.find(d => d.id === deviceIdToLink);
      if (device) {
        setSelectedDevice(deviceIdToLink);
      }
    }
  }, [deviceIdToLink, recentDevices]);

  const loadDeviceInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get currently linked device
      const linkedRes = await getLinkedDevice(user.uid);
      if (linkedRes?.linkedDevice) {
        setLinkedDevice(linkedRes.linkedDevice);
      }

      // Get recent devices
      const devicesRes = await getRecentDevicesForLinking(user.uid);
      if (devicesRes?.devices) {
        setRecentDevices(devicesRes.devices);
        // Auto-select first device if provided
        if (deviceIdToLink && devicesRes.devices.some(d => d.id === deviceIdToLink)) {
          setSelectedDevice(deviceIdToLink);
        }
      }
    } catch (err) {
      console.error('Failed to load device info:', err);
      setError('Failed to load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    if (!category) return <SmartphoneIcon />;
    const lower = category.toLowerCase();
    if (lower.includes('phone') || lower.includes('smartphone')) return <SmartphoneIcon />;
    if (lower.includes('laptop') || lower.includes('computer')) return <LaptopIcon />;
    if (lower.includes('tablet')) return <TabletIcon />;
    return <SmartphoneIcon />;
  };

  const handleLink = async () => {
    if (!selectedDevice) {
      setError('Please select a device to link');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await linkDeviceToSubscription(user.uid, selectedDevice, linkedBy);
      
      if (result?.success) {
        setLinkedDevice(result.linkedDevice);
        onLinkSuccess(result.linkedDevice);
        
        // Close after short delay to show success
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to link device:', err);
      setError(err.message || 'Failed to link device. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(5, 19, 35, 0.95) 0%, rgba(16, 56, 82, 0.9) 100%)',
          border: '2px solid rgba(72, 206, 219, 0.2)'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #48cedb 0%, #10B981 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 'bold'
        }}
      >
        <LinkIcon /> Link Device to Your Subscription
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#48cedb' }} />
          </Box>
        ) : (
          <Stack spacing={3}>
            {error && (
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5'
                }}
              >
                {error}
              </Alert>
            )}

            {linkedDevice && (
              <Alert
                severity="info"
                icon={<CheckIcon />}
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#86EFAC'
                }}
              >
                Currently linked: <strong>{linkedDevice.name}</strong>
              </Alert>
            )}

            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}
            >
              {linkedBy === 'AUTO_CHECKOUT'
                ? '🎉 Your new purchase will be protected by your subscription'
                : "Select a device from your order history to protect with your subscription"
              }
            </Typography>

            {recentDevices.length > 0 ? (
              <RadioGroup
                value={selectedDevice?.toString() || ''}
                onChange={(e) => setSelectedDevice(parseInt(e.target.value))}
              >
                <Stack spacing={1.5}>
                  {recentDevices.map((device) => (
                    <Paper
                      key={device.id}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: selectedDevice === device.id
                          ? 'rgba(72, 206, 219, 0.15)'
                          : 'rgba(5, 19, 35, 0.6)',
                        border: selectedDevice === device.id
                          ? '2px solid #48cedb'
                          : '2px solid rgba(72, 206, 219, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(72, 206, 219, 0.1)',
                          border: '2px solid rgba(72, 206, 219, 0.4)'
                        }
                      }}
                    >
                      <FormControlLabel
                        value={device.id}
                        control={<Radio sx={{ color: '#48cedb' }} />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: 'rgba(72, 206, 219, 0.2)',
                                color: '#48cedb'
                              }}
                            >
                              {getCategoryIcon(device.category)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color: 'white',
                                  fontWeight: 600,
                                  mb: 0.5
                                }}
                              >
                                {device.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                <AccessTimeIcon sx={{ fontSize: 14 }} />
                                {new Date(device.orderDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Chip
                              label={device.category}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(72, 206, 219, 0.2)',
                                color: '#48cedb'
                              }}
                            />
                          </Box>
                        }
                        sx={{ width: '100%', ml: 0 }}
                      />
                    </Paper>
                  ))}
                </Stack>
              </RadioGroup>
            ) : (
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(245, 158, 11, 0.08)',
                  border: '2px dashed rgba(245, 158, 11, 0.4)',
                  borderRadius: 2
                }}
              >
                <AccessTimeIcon
                  sx={{
                    fontSize: 48,
                    color: 'rgba(245, 158, 11, 0.5)',
                    mb: 1
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mb: 2
                  }}
                >
                  No recent purchases found
                </Typography>
                <Button
                  variant="outlined"
                  href="/gadgets"
                  sx={{
                    color: '#48cedb',
                    borderColor: '#48cedb',
                    '&:hover': {
                      bgcolor: 'rgba(72, 206, 219, 0.1)'
                    }
                  }}
                >
                  Browse Gadgets
                </Button>
              </Paper>
            )}

            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                display: 'block',
                pt: 2,
                borderTop: '1px solid rgba(72, 206, 219, 0.2)'
              }}
            >
              💡 Your subscription covers device insurance, free delivery, and member discounts.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLink}
          disabled={!selectedDevice || submitting || loading}
          variant="contained"
          sx={{
            bgcolor: '#48cedb',
            color: '#051323',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#3aa6b8' },
            '&:disabled': { bgcolor: 'rgba(72, 206, 219, 0.3)' }
          }}
        >
          {submitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
              Linking...
            </>
          ) : (
            'Link Device'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionDeviceLinker;
