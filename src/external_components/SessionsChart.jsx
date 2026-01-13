import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

// Normalize incoming data into the { name, value1, value2?, value3? } shape
const normalizeData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0] || {};
  // If already in value1/value2/value3 shape
  if ('value1' in first || 'value2' in first || 'value3' in first) {
    return data;
  }
  // If single series { name, value }
  if ('value' in first) {
    return data.map((d) => ({ name: d.name, value1: Number(d.value || 0) }));
  }
  return null;
};

export default function SessionsChart({ title = 'Sessions', data: dataProp, headline, delta, deltaType = 'positive' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Ensure chartData is always an array to avoid null access errors
  const chartData = normalizeData(dataProp) || [];
  const hasValue2 = chartData.length > 0 && 'value2' in chartData[0];
  const hasValue3 = chartData.length > 0 && 'value3' in chartData[0];

  return (
    <Card sx={{ height: { xs: 300, sm: 350, md: 400 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
            {title}
          </Typography>
        </Box>

        {(headline || delta) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
              mb: 1,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            {headline && (
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
                {headline}
              </Typography>
            )}
            {typeof delta !== 'undefined' && (
              <Typography
                variant="body2"
                sx={{ color: deltaType === 'negative' ? '#ef4444' : '#22c55e', fontWeight: 500 }}
              >
                {delta}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sessions per day for the last 30 days
        </Typography>

        <Box sx={{ height: { xs: 150, sm: 200, md: 250 } }}>
          {Array.isArray(chartData) && chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Area type="monotone" dataKey="value1" stroke="#3b82f6" fill="url(#colorGradient1)" strokeWidth={2} />
                {hasValue2 && (
                  <Area type="monotone" dataKey="value2" stroke="#06b6d4" fill="url(#colorGradient2)" strokeWidth={2} />
                )}
                {hasValue3 && (
                  <Area type="monotone" dataKey="value3" stroke="#0ea5e9" fill="url(#colorGradient3)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}