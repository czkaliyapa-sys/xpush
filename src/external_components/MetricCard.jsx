import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function MetricCard({ title, value, change, changeType, period, chartData, chartColor }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const data = chartData.map((value, index) => ({ value, index }));
  
  const changeColor = changeType === 'positive' ? '#22c55e' : '#ef4444';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 }, 
          mb: 1,
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
            {value}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: changeColor,
              fontWeight: 500,
            }}
          >
            {change}
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          {period}
        </Typography>
        
        <Box sx={{ height: { xs: 40, sm: 60 }, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}