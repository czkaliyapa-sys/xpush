import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showConfirmMatch?: boolean;
}

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

declare const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps>;
export const validatePasswordStrength: (password: string) => PasswordValidationResult;

export default PasswordStrengthIndicator;