import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectProps } from '@mui/material/Select';

export default function ColorModeSelect(props: SelectProps) {
  // MUI v5 fallback: render a disabled selector to avoid runtime errors
  const mode = 'light';
  return (
    <Select
      value={mode}
      disabled
      SelectDisplayProps={{
        // @ts-ignore
        'data-screenshot': 'toggle-mode',
      }}
      {...props}
    >
      <MenuItem value="light">Light</MenuItem>
    </Select>
  );
}
