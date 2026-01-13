/**
 * SubscriptionDeviceStatus Component
 * 
 * Displays current device linked to user's subscription
 * and provides option to change device.
 * Used in dashboard payments tab.
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Link as LinkIcon,
  Edit as EditIcon,
  SwapHoriz as SwapIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Smartphone as SmartphoneIcon,
  Laptop as LaptopIcon,
  PhoneAndroid as TabletIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getLinkedDevice } from '../services/paymentService.js';
import SubscriptionDeviceLinker from './SubscriptionDeviceLinker.jsx';

const SubscriptionDeviceStatus = ({
  subscription = null,
  onDeviceChanged = () => {}
}) => {
  const { user } = useAuth();
  const [linkedDevice, setLinkedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkerOpen, setLinkerOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.uid && subscription?.isActive) {
      loadLinkedDevice();
    } else {
      setLoading(false);
    }
  }, [user?.uid, subscription?.isActive]);

  const loadLinkedDevice = async () => {
    try {
      setLoading(true);
      const result = await getLinkedDevice(user.uid);
      setLinkedDevice(result?.linkedDevice || null);
    } catch (err) {
      console.error('Failed to load linked device:', err);
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

  const handleDeviceLinkSuccess = (device) => {
    setLinkedDevice(device);
    onDeviceChanged(device);
  };

  if (!subscription?.isActive) {
    return null;
  }

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          bgcolor: 'rgba(5, 19, 35, 0.6)',
          border: '1px solid rgba(72, 206, 219, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 120
        }}
      >
        <CircularProgress sx={{ color: '#48cedb' }} size={32} />
      </Paper>
    );
  }

  // If Plus subscription but no device linked - show warning
  if (subscription.tier === 'plus' && !linkedDevice) {
    return (
      <>
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setLinkerOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Link Now
            </Button>
          }
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.1)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            color: '#FECACA',
            mb: 2
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Link a device to activate protection
            </Typography>
            <Typography variant="caption">
              Your XtraPush Plus is ready to protect your device from damage and accidental drops.
            </Typography>
          </Box>
        </Alert>

        <SubscriptionDeviceLinker
          open={linkerOpen}
          onClose={() => setLinkerOpen(false)}
          onLinkSuccess={handleDeviceLinkSuccess}
          linkedBy="MANUAL"
        />
      </>
    );
  }

  // Device is linked - show status card
  return (
    <>
      <Paper
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(72, 206, 219, 0.05) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 2
        }}
      >
        <Stack spacing={2.5}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: '#10B981',
                  fontWeight: 700,
                  mb: 0.25
                }}
              >
                Device Protection Active
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {subscription.tier === 'premium'
                  ? 'All your devices are covered'
                  : 'Protection active on this device'}
              </Typography>
            </Box>
          </Box>

          {/* Linked Device Card - Only show for Plus (Premium shows "All devices") */}
          {subscription.tier === 'plus' && linkedDevice && (
            <>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(5, 19, 35, 0.6)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10B981',
                    flexShrink: 0
                  }}
                >
                  {getCategoryIcon(linkedDevice.category)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {linkedDevice.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  >
                    {linkedDevice.category}
                  </Typography>
                </Box>
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Protected"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10B981',
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                />
              </Box>

              {/* Change Device Button */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<SwapIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                sx={{
                  color: '#48cedb',
                  borderColor: '#48cedb',
                  borderWidth: 2,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#48cedb',
                    backgroundColor: 'rgba(72, 206, 219, 0.1)',
                    borderWidth: 2
                  }
                }}
              >
                Change Device
              </Button>
            </>
          )}

          {/* Premium Coverage Info */}
          {subscription.tier === 'premium' && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: 1.5
              }}
            >
              <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                <strong>🎉 All Your Devices Are Protected</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Your XtraPush Premium covers every device in your account. Coverage includes device insurance, free delivery, and exclusive discounts.
              </Typography>
            </Box>
          )}

          {/* Coverage Details */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(5, 19, 35, 0.4)',
              border: '1px solid rgba(72, 206, 219, 0.1)',
              borderRadius: 1.5
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
              What's Included:
            </Typography>
            <Stack spacing={0.75}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75
                }}
              >
                ✓ Device insurance (1 year)
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75
                }}
              >
                ✓ Free unlimited delivery
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75
                }}
              >
                ✓ Member-exclusive discounts
              </Typography>
              {subscription.tier === 'premium' && (
                <>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75
                    }}
                  >
                    ✓ Priority support
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75
                    }}
                  >
                    ✓ Early access to new gadgets
                  </Typography>
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Change Device Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(5, 19, 35, 0.95) 0%, rgba(16, 56, 82, 0.9) 100%)',
            border: '2px solid rgba(72, 206, 219, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 'bold' }}>
          Change Protected Device?
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
            Switching to a different device will move coverage from <strong>{linkedDevice?.name}</strong> to your new selection.
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Make sure the device is from your purchase history.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmDialogOpen(false);
              setLinkerOpen(true);
            }}
            variant="contained"
            sx={{
              bgcolor: '#48cedb',
              color: '#051323',
              fontWeight: 'bold'
            }}
          >
            Change Device
          </Button>
        </DialogActions>
      </Dialog>

      {/* Device Linker Modal */}
      <SubscriptionDeviceLinker
        open={linkerOpen}
        onClose={() => setLinkerOpen(false)}
        onLinkSuccess={handleDeviceLinkSuccess}
        linkedBy="MANUAL"
      />
    </>
  );
};

export default SubscriptionDeviceStatus;
