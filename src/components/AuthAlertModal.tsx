import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface AuthAlertModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  showSignInButton?: boolean;
}

/**
 * AuthAlertModal
 * A themed modal for authentication alerts that matches the app's design system.
 * Used before checkout and installment flows to prompt users to sign in.
 */
const AuthAlertModal: React.FC<AuthAlertModalProps> = ({
  open,
  onClose,
  title = 'Authentication Required',
  message,
  actionLabel = 'Sign In',
  onAction,
  showSignInButton = true
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSignIn = () => {
    onClose();
    if (onAction) {
      onAction();
    } else {
      navigate('/signin');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#0f1419',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#3b82f6'
        }}
      >
        <InfoIcon sx={{ fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              fontSize: '0.95rem'
            }}
          >
            {message}
          </Typography>

          <Box
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              p: 2,
              mt: 1
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block'
              }}
            >
              💡 Signing in takes less than a minute and is completely secure.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 1.5
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.9)'
            },
            width: isMobile ? '100%' : 'auto'
          }}
        >
          Cancel
        </Button>

        {showSignInButton && (
          <Button
            onClick={handleSignIn}
            variant="contained"
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              padding: '8px 24px',
              '&:hover': {
                backgroundColor: '#2563eb',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
              },
              width: isMobile ? '100%' : 'auto'
            }}
          >
            {actionLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AuthAlertModal;
