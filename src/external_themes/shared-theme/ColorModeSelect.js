import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

export default function ColorModeSelect(props) {
  const mode = 'light';
  return (
    <Select
      value={mode}
      disabled
      SelectDisplayProps={{
        'data-screenshot': 'toggle-mode',
      }}
      {...props}
    >
      <MenuItem value="light">Light</MenuItem>
    </Select>
  );
}
