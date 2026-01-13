import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { authAPI } from '../services/api.js';
import PasswordStrengthIndicator, { validatePasswordStrength } from '../components/PasswordStrengthIndicator.jsx';
import { CheckCircle as CheckCircleIcon, Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
  initialEmail?: string;
}

export default function ForgotPassword({ open, handleClose, initialEmail }: ForgotPasswordProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [stage, setStage] = React.useState<'request' | 'confirm'>('request');
  const [email, setEmail] = React.useState<string>('');
  const [otpDigits, setOtpDigits] = React.useState<string[]>(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = React.useState<boolean>(false);
  const [resendSeconds, setResendSeconds] = React.useState<number>(0);
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [showNewPassword, setShowNewPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open && initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [open, initialEmail]);
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Start resend timer when entering confirm stage
  React.useEffect(() => {
    if (stage === 'confirm' && resendSeconds > 0) {
      const id = setInterval(() => {
        setResendSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [stage, resendSeconds]);

  const otpString = otpDigits.join('');

  const handleOtpChange = (index: number, value: string) => {
    const digit = (value || '').replace(/\D/g, '').slice(0, 1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
  };

  const handleOtpPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 0) return;
    const filled = text.split('');
    setOtpDigits([
      filled[0] || '', filled[1] || '', filled[2] || '', filled[3] || '', filled[4] || '', filled[5] || ''
    ]);
  };

  const onRequest = async (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const currentEmail = email?.trim();
      if (!currentEmail) {
        setError('Please enter your email address.');
        return;
      }

      const result = await authAPI.requestPasswordReset(currentEmail);
      if (result && result.success) {
        setSuccess('We\'ve sent a 6-digit code to your email. Enter it below to verify.');
        if ((result as any).debugToken && isLocalhost) {
          const dbg = String((result as any).debugToken);
          const filled = dbg.replace(/\D/g, '').slice(0, 6).split('');
          setOtpDigits([filled[0] || '', filled[1] || '', filled[2] || '', filled[3] || '', filled[4] || '', filled[5] || '']);
        }
        setStage('confirm');
        setResendSeconds((result as any)?.resendDelay ?? 30);
        setOtpVerified(false);
      } else {
        setError((result && (result as any).error) || 'Failed to request password reset.');
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const currentEmail = email?.trim();
      if (!currentEmail) {
        setError('Please enter your email address.');
        return;
      }
      if (!/^[0-9]{6}$/.test(otpString)) {
        setError('Please enter the 6-digit code sent to your email.');
        return;
      }

      const result = await authAPI.verifyOtp({ email: currentEmail, token: otpString });
      if (result && result.success) {
        setOtpVerified(true);
        setSuccess('Code verified! You can now set a new password.');
      } else {
        setError((result && (result as any).error) || 'Failed to verify code.');
      }
    } catch (e: any) {
      const errorType = e?.response?.data?.errorType;
      if (errorType === 'no_active_reset') {
        setStage('request');
      }
      setError(e?.response?.data?.error || e?.message || 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const currentEmail = email?.trim();
      const currentPassword = newPassword?.trim();

      if (!currentEmail) {
        setError('Please enter your email address.');
        return;
      }
      if (!/^[0-9]{6}$/.test(otpString)) {
        setError('Please enter the 6-digit code sent to your email.');
        return;
      }
      if (!currentPassword) {
        setError('Please enter your new password.');
        return;
      }

      const strengthOk = validatePasswordStrength(currentPassword);
      if (!strengthOk.isValid) {
        setError(strengthOk.errors?.[0] || 'Password is too weak. Please choose a stronger password.');
        return;
      }
      if (currentPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const payload: any = { email: currentEmail, newPassword: currentPassword, token: otpString };

      const result = await authAPI.confirmPasswordReset(payload);
      if (result && result.success) {
        setSuccess('Your password has been reset successfully. You can now sign in.');
      } else {
        setError((result && (result as any).error) || 'Failed to reset password.');
      }
    } catch (e: any) {
      const errorType = e?.response?.data?.errorType;
      if (errorType === 'no_active_reset') {
        setStage('request');
      }
      setError(e?.response?.data?.error || e?.message || 'Failed to reset password.');
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
        onSubmit: stage === 'request' ? onRequest : (otpVerified ? onConfirm : onVerifyCode),
        sx: {
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #48cedb 0%, #2fa7b8 100%)',
          boxShadow: '0 8px 32px rgba(72, 206, 219, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      {/* Header with icon and title */}
      <DialogTitle sx={{ pb: 1, pt: 3, color: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {stage === 'request' && <EmailIcon sx={{ color: '#fff', fontSize: 28 }} />}
          {stage === 'confirm' && !otpVerified && <LockIcon sx={{ color: '#fff', fontSize: 28 }} />}
          {stage === 'confirm' && otpVerified && <CheckCircleIcon sx={{ color: '#fff', fontSize: 28 }} />}
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
            {stage === 'request' ? 'Reset Password' : (otpVerified ? 'Create New Password' : 'Verify Your Code')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          width: '100%',
          py: 2
        }}
      >
        {/* Status message */}
        <DialogContentText sx={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.95)', lineHeight: 1.6, fontWeight: 500 }}>
          {stage === 'request'
            ? 'We\'ll send a secure code to your email address. This code is valid for 10 minutes.'
            : (!otpVerified
              ? 'Check your email inbox for the 6-digit code. If you don\'t see it, check your spam folder.'
              : 'Great! Your code is verified. Create a strong password below.')}
        </DialogContentText>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '0.9rem', bgcolor: 'rgba(244, 67, 54, 0.15)', color: '#fff', border: '1px solid rgba(244, 67, 54, 0.3)', '& .MuiAlert-icon': { color: '#fff' } }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ borderRadius: '10px', fontSize: '0.9rem', bgcolor: 'rgba(76, 175, 80, 0.15)', color: '#fff', border: '1px solid rgba(76, 175, 80, 0.3)', '& .MuiAlert-icon': { color: '#fff' } }}>
            {success}
          </Alert>
        )}

        {/* Email input */}
        <FormControl fullWidth>
          <FormLabel htmlFor="reset-email" sx={{ mb: 1, fontWeight: 600, color: '#fff' }}>
            Email Address
          </FormLabel>
          <TextField
            autoFocus
            required
            id="reset-email"
            name="email"
            placeholder="your@email.com"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={stage === 'confirm'}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#0f172a',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#fff',
                  borderWidth: 2,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  opacity: 0.7
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#64748b', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

        {/* OTP verification stage */}
        {stage === 'confirm' && (
          <>
            {/* OTP input boxes */}
            <Box>
              <FormLabel sx={{ display: 'block', mb: 1.5, fontWeight: 600, color: '#fff' }}>
                Enter 6-Digit Code
              </FormLabel>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                {otpDigits.map((d, idx) => (
                  <OutlinedInput
                    key={idx}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: 20,
                        width: 45,
                        height: 45
                      },
                      autoComplete: 'one-time-code',
                    }}
                    value={d}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      transition: 'all 0.3s ease',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#fff',
                        borderWidth: 2,
                      }
                    }}
                  />
                ))}
              </Box>

              {/* Resend timer */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.9)'
              }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                  {resendSeconds > 0 ? `⏱️ Resend code in ${resendSeconds}s` : '✓ Ready to resend'}
                </Typography>
                <Button
                  size="small"
                  disabled={resendSeconds > 0 || loading}
                  onClick={onRequest}
                  sx={{
                    textTransform: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                    '&:disabled': { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  Resend Code
                </Button>
              </Box>
            </Box>

            {/* Password reset stage (after OTP verified) */}
            {otpVerified && (
              <Box sx={{
                pt: 2,
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>
                  Create a Strong Password
                </Typography>

                <FormControl fullWidth>
                  <FormLabel htmlFor="new-password" sx={{ mb: 1, fontWeight: 500, color: 'rgba(255,255,255,0.95)' }}>
                    New Password
                  </FormLabel>
                  <TextField
                    required
                    id="new-password"
                    name="newPassword"
                    placeholder="Enter new password"
                    type={showNewPassword ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        '&:hover fieldset': {
                          borderColor: '#2563eb',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563eb',
                          borderWidth: 2,
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <Box sx={{ py: 1 }}>
                    <PasswordStrengthIndicator password={newPassword} />
                  </Box>
                )}

                <FormControl fullWidth>
                  <FormLabel htmlFor="confirm-password" sx={{ mb: 1, fontWeight: 500, color: 'rgba(255,255,255,0.95)' }}>
                    Confirm Password
                  </FormLabel>
                  <TextField
                    required
                    id="confirm-password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    fullWidth
                    variant="outlined"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={confirmPassword !== '' && newPassword !== confirmPassword}
                    helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        '&:hover fieldset': {
                          borderColor: '#2563eb',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563eb',
                          borderWidth: 2,
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ gap: 1, pb: 2.5, px: 3 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            color: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.6)'
            }
          }}
        >
          Cancel
        </Button>
        <Box sx={{ position: 'relative' }}>
          <Button
            variant="contained"
            type="submit"
            disabled={loading || (stage === 'confirm' && !otpVerified && otpString.length !== 6)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.3)',
              backgroundColor: '#0f172a !important',
              color: '#fff !important',
              '&:hover': {
                backgroundColor: '#1e293b !important',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.4)'
              },
              '&:disabled': {
                backgroundColor: 'rgba(15, 23, 42, 0.4) !important',
                color: 'rgba(255,255,255,0.6) !important',
                boxShadow: 'none'
              },
              transition: 'all 0.3s ease',
              minWidth: 140
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              stage === 'request' ? 'Send Code' : (otpVerified ? 'Reset Password' : 'Verify Code')
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
