import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const PasswordStrengthIndicator = ({ 
  password, 
  confirmPassword = '', 
  showConfirmMatch = false 
}) => {
  // Use string methods instead of complex regex to avoid parsing issues
  const hasUppercase = password.split('').some(char => char >= 'A' && char <= 'Z');
  const hasLowercase = password.split('').some(char => char >= 'a' && char <= 'z');
  const hasNumber = password.split('').some(char => char >= '0' && char <= '9');
  const hasSpecialChar = password.split('').some(char => '!@#$%^&*(),.?":{}|<>'.includes(char));

  const criteria = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      label: 'Contains uppercase letter',
      met: hasUppercase
    },
    {
      label: 'Contains lowercase letter',
      met: hasLowercase
    },
    {
      label: 'Contains number',
      met: hasNumber
    },
    {
      label: 'Contains special character (!@#$%^&*)',
      met: hasSpecialChar
    }
  ];

  const passwordsMatch = !showConfirmMatch || !confirmPassword || password === confirmPassword;
  const metCriteria = criteria.filter(c => c.met).length;
  const strengthScore = (metCriteria / criteria.length) * 100;
  
  const getStrengthLevel = () => {
    if (strengthScore < 40) return { level: 'Weak', color: 'error.main' };
    if (strengthScore < 80) return { level: 'Medium', color: 'warning.main' };
    return { level: 'Strong', color: 'success.main' };
  };
  
  const { level, color } = getStrengthLevel();
  
  return (
    <Box sx={{ mt: 1, mb: 2 }}>
      {password && (
        <>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Password Strength:
              </Typography>
              <Chip 
                label={level} 
                size="small" 
                sx={{ 
                  bgcolor: color, 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={strengthScore} 
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: color,
                  borderRadius: 4
                }
              }}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Password Requirements:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {criteria.map((criterion, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {criterion.met ? (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                  ) : (
                    <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: criterion.met ? 'success.main' : 'text.secondary',
                      textDecoration: criterion.met ? 'line-through' : 'none'
                    }}
                  >
                    {criterion.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          
          {showConfirmMatch && confirmPassword && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {passwordsMatch ? (
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
              ) : (
                <CancelIcon sx={{ color: 'error.main', fontSize: 16 }} />
              )}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: passwordsMatch ? 'success.main' : 'error.main'
                }}
              >
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// Validation function for use in forms (using same logic as component)
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  const hasUppercase = password.split('').some(char => char >= 'A' && char <= 'Z');
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  const hasLowercase = password.split('').some(char => char >= 'a' && char <= 'z');
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  const hasNumber = password.split('').some(char => char >= '0' && char <= '9');
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  const hasSpecialChar = password.split('').some(char => '!@#$%^&*(),.?":{}|<>'.includes(char));
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default PasswordStrengthIndicator;