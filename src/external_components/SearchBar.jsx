// SearchBar.jsx
import React, { useState, useEffect } from 'react';
import { InputBase, Paper, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'framer-motion';
const MotionPaper = motion(Paper);

const SearchBar = ({ onSearch, onInputChange, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  
  // Initialize with initialQuery if provided
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() !== '') {
      // Just trigger the search without navigation
      if (onSearch) onSearch(query);
    }
  };



  return (
    <Box sx={{ position: 'relative', width: { xs: '95%', sm: '85%', md: '95%', lg: '95%' }, maxWidth: '690px', mx: 'auto' }}>
      <MotionPaper
        component="form"
        onSubmit={handleSubmit}
        initial={{ boxShadow: '0px 0px 0px 0px rgba(0,150,136,0)', filter: 'drop-shadow(0px 0px 0px rgba(0,150,136,0))' }}
        animate={{
          width: focused ? '100%' : '85%',
          boxShadow: focused
            ? [
                '0px 0px 0px 0px rgba(0,206,209,0)',
                '0px 0px 20px 8px rgba(0,206,209,0.28)',
                '0px 0px 0px 0px rgba(0,206,209,0)'
              ]
            : '0px 0px 0px 0px rgba(0,206,209,0)',
          filter: focused ? 'drop-shadow(0px 0px 12px rgba(0,206,209,0.26))' : 'drop-shadow(0px 0px 0px rgba(0,206,209,0))'
        }}
        transition={{
          width: { duration: 0.4, ease: 'easeInOut' },
          boxShadow: { duration: 1.8, ease: 'easeInOut', repeat: focused ? Infinity : 0, repeatType: 'mirror' },
          filter: { duration: 0.5, ease: 'easeInOut' }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          borderRadius: 2,
          overflow: 'visible',
          width: '100%', // allow framer motion to control width
          mx: 'auto',
          zIndex: 10
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Type your gadget"
          inputProps={{ 'aria-label': 'search' }}
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            if (onInputChange) onInputChange(newValue);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </MotionPaper>

      {/* Glow layer to guarantee visibility regardless of Paper styles (light tone) */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{
          opacity: focused ? 0.55 : 0,
          boxShadow: focused ? '0 0 24px 10px rgba(0,206,209,0.28)' : '0 0 0 0 rgba(0,0,0,0)'
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 12,
          pointerEvents: 'none',
          zIndex: 9
        }}
      />
    </Box>
  );
};

export default SearchBar;
