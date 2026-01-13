import * as React from 'react';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import Box from '@mui/material/Box';

export default function ColorModeIconDropdown() {
  // MUI v5 fallback: show a static light mode icon without interaction
  return (
    <Box data-screenshot="toggle-mode" aria-label="mode">
      <LightModeIcon />
    </Box>
  );
}
