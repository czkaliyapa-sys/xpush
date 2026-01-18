import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

const RadioCircleTestFixed = () => {
  const [selected, setSelected] = useState(null);

  const options = ['plus', 'premium', 'standard'];

  return (
    <Box sx={{ p: 3, bgcolor: '#0f172a', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
        Radio Circle Size Test - FIXED VERSION
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {options.map((option) => (
          <Box
            key={option}
            onClick={() => setSelected(option)}
            sx={{
              p: 2,
              borderRadius: 2,
              border: selected === option ? '2px solid #48CEDB' : '1px solid rgba(255,255,255,0.3)',
              bgcolor: selected === option ? 'rgba(72, 206, 219, 0.12)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              width: '100%',
              flex: 1,
              position: 'relative'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: selected === option ? '2px solid #48CEDB' : '2px solid rgba(255,255,255,0.3)',
                bgcolor: selected === option ? '#48CEDB' : 'transparent',
                flexShrink: 0,
                mt: 0.3,
                position: 'relative',
                '&::before': selected === option ? {
                  content: '""',
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  borderRadius: '50%',
                  border: '3px solid #48CEDB'
                } : {}
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 700 }}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Click to select (fixed size)
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ color: 'white' }}>
          Current selection: {selected || 'none'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
          ✅ Fixed: All radio circles maintain consistent size regardless of selection state
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
          Solution: Use consistent 2px border + ::before pseudo-element for selection highlight
        </Typography>
      </Box>
    </Box>
  );
};

export default RadioCircleTestFixed;