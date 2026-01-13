import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { typography, shadows, shape, getDesignTokens } from './themePrimitives';

function AppTheme({ children, disableCustomTheme, themeComponents }) {
  const theme = React.useMemo(() => {
    if (disableCustomTheme) {
      return {};
    }
    const base = createTheme({
      // Provide palette based on light mode tokens for MUI v5
      ...getDesignTokens('light'),
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
      applyStyles: (scheme, styles) => {
        const mode = (base.palette && base.palette.mode) || 'light';
        if (scheme === mode) {
          return styles;
        }
        return {};
      },
    };
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

AppTheme.propTypes = {
  children: PropTypes.node,
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme: PropTypes.bool,
  themeComponents: PropTypes.object,
};

export default AppTheme;
