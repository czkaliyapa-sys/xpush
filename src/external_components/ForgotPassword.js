import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { authAPI } from '../services/api.js';
import PasswordStrengthIndicator, { validatePasswordStrength } from '../components/PasswordStrengthIndicator.jsx';

export default function ForgotPassword({ open, handleClose, initialEmail }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [stage, setStage] = React.useState('request');
  const [email, setEmail] = React.useState('');
  const [token, setToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  React.useEffect(() => {
    if (open && initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [open, initialEmail]);
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const onRequest = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const currentEmail = (email || '').trim();
      if (!currentEmail) {
        setError('Please enter your email address.');
        return;
      }

      const result = await authAPI.requestPasswordReset(currentEmail);
      if (result && result.success) {
        setSuccess('If an account exists, a reset link has been sent to your email.');
        if (result.debugToken) {
          setToken(result.debugToken);
        }
        setStage('confirm');
      } else {
        setError((result && result.error) || 'Failed to request password reset.');
      }
    } catch (e) {
      setError((e && e.response && e.response.data && e.response.data.error) || e.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const currentEmail = (email || '').trim();
      const currentToken = (token || '').trim();
      const currentPassword = (newPassword || '').trim();
      if (!currentEmail) {
        setError('Please enter your email address.');
        return;
      }
      if (!currentPassword) {
        setError('Please enter your new password.');
        return;
      }
      const strengthOk = validatePasswordStrength(currentPassword);
      if (!strengthOk.isValid) {
        setError((strengthOk.errors && strengthOk.errors[0]) || 'Password is too weak. Please choose a stronger password.');
        return;
      }
      if (currentPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const payload = { email: currentEmail, newPassword: currentPassword };
      if (currentToken) {
        payload.token = currentToken;
      }

      const result = await authAPI.confirmPasswordReset(payload);
      if (result && result.success) {
        setSuccess('Your password has been reset successfully. You can now sign in.');
      } else {
        setError((result && result.error) || 'Failed to reset password.');
      }
    } catch (e) {
      const errorType = e && e.response && e.response.data && e.response.data.errorType;
      if (errorType === 'no_active_reset') {
        setStage('request');
      }
      setError((e && e.response && e.response.data && e.response.data.error) || e.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: stage === 'request' ? onRequest : onConfirm,
      }}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          {stage === 'request'
            ? 'Enter your email address, and we\'ll send a reset link.'
            : 'Choose a new password. Token is optional; if you have one, enter it.'}
        </DialogContentText>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          label="Email address"
          placeholder="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {stage === 'confirm' && (
          <>
            {!isLocalhost && (
              <OutlinedInput
                margin="dense"
                id="token"
                name="token"
                label="Reset token (optional)"
                placeholder="Reset token (optional)"
                type="text"
                fullWidth
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            )}
            <OutlinedInput
              required
              margin="dense"
              id="newPassword"
              name="newPassword"
              label="New password"
              placeholder="New password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <OutlinedInput
              required
              margin="dense"
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm password"
              placeholder="Confirm password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <PasswordStrengthIndicator 
              password={newPassword} 
              confirmPassword={confirmPassword} 
              showConfirmMatch={true} 
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ position: 'relative' }}>
          <Button variant="contained" type="submit" disabled={loading}>
            {stage === 'request' ? 'Send reset link' : 'Reset password'}
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  initialEmail: PropTypes.string,
};
