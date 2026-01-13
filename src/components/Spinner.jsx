import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { teal } from '@mui/material/colors';

export default function Spinner(color) {
  return (
    <Box sx={{ display: 'flex' }}>
      <CircularProgress sx={{ color: {color}}} />
    </Box>
  );
}
