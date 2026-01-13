import React from 'react';
import { Card, CardContent, Typography, Box, Button, useTheme, useMediaQuery } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function InsightsCard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: { xs: 2, sm: 3 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUpIcon sx={{ color: '#3b82f6', mr: 1 }} />
        </Box>
        
        <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold" gutterBottom>
          Explore your data
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: { xs: 2, sm: 3 }, 
          flexGrow: 1,
          fontSize: { xs: '0.875rem', sm: '0.875rem' }
        }}>
          Uncover performance and visitor insights with our data wizardry.
        </Typography>
        
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          size={isMobile ? "small" : "medium"}
          sx={{
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            '&:hover': {
              backgroundColor: '#e2e8f0',
            },
            alignSelf: 'flex-start',
          }}
        >
          Get insights
        </Button>
      </CardContent>
    </Card>
  );
}