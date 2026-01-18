export const colors = {
  light: {
    primary: '#0891b2',
    primaryDark: '#0e7490',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceVariant: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    card: '#ffffff',
    notification: '#ef4444',
  },
  dark: {
    primary: '#22d3ee',
    primaryDark: '#0891b2',
    secondary: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    card: '#1e293b',
    notification: '#ef4444',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const formatPrice = (price, currency = 'GBP') => {
  if (currency === 'GBP') {
    return `£${Number(price).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `MK${Number(price).toLocaleString('en-MW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
