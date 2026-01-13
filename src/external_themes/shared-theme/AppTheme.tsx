import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { typography, shadows, shape, getDesignTokens } from './themePrimitives';

interface AppThemeProps {
  children: React.ReactNode;
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme?: boolean;
  themeComponents?: ThemeOptions['components'];
}

export default function AppTheme({
  children,
  disableCustomTheme,
  themeComponents,
}: AppThemeProps) {
  const theme = React.useMemo(() => {
    if (disableCustomTheme) {
      return {} as any;
    }
    const base = createTheme({
      // Provide palette based on dark mode tokens for MUI v5
      ...getDesignTokens('dark'),
      palette: { mode: 'dark' },
      typography,
      shadows,
      shape,
      components: {
        ...inputsCustomizations,
        ...dataDisplayCustomizations,
        ...feedbackCustomizations,
        ...navigationCustomizations,
        ...surfacesCustomizations,
        ...themeComponents,
      },
    });
    // Polyfill theme.applyStyles used by customizations (MUI v6 API)
    const themeWithApply = {
      ...base,
      applyStyles: (scheme: 'dark' | 'light', styles: Record<string, any>) => {
        const mode = (base.palette && base.palette.mode) || 'light';
        if (scheme === mode) {
          return styles;
        }
        return {};
      },
    } as any;
    return themeWithApply;
  }, [disableCustomTheme, themeComponents]);
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}
