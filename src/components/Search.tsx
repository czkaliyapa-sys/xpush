import * as React from 'react';
import { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { motion } from 'framer-motion';

const MotionFormControl = motion(FormControl as any);

export default function Search() {
  const [focused, setFocused] = useState(false);

  return (
    <MotionFormControl 
      sx={{ width: { xs: '100%', md: focused ? '30ch' : '25ch' } }} 
      variant="outlined"
      animate={{ scale: focused ? 1.02 : 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <OutlinedInput
        size="small"
        id="search"
        placeholder="Search…"
        sx={{ flexGrow: 1 }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.primary' }}>
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        }
        inputProps={{
          'aria-label': 'search',
        }}
      />
    </MotionFormControl>
  );
}
