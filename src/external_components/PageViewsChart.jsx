import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

// Normalize incoming data into { name, pageViews?, downloads? }
const normalizeData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0] || {};
  // Already normalized
  if ('pageViews' in first || 'downloads' in first) return data;
  // Single series { name, value } treated as pageViews
  if ('value' in first) return data.map((d) => ({ name: d.name, pageViews: Number(d.value || 0) }));
  return null;
};

export default function PageViewsChart({ data: dataProp, headline, delta, deltaType = 'negative', title = 'Page views and downloads' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const chartData = normalizeData(dataProp);
  const hasPageViews = Array.isArray(chartData) && chartData.length > 0 && 'pageViews' in chartData[0];
  const hasDownloads = Array.isArray(chartData) && chartData.length > 0 && 'downloads' in chartData[0];

  return (
    <Card sx={{ height: { xs: 300, sm: 350, md: 400 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" gutterBottom>
          {title}
        </Typography>

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
              <Typography variant="body2" sx={{ color: deltaType === 'negative' ? '#ef4444' : '#22c55e', fontWeight: 500 }}>
                {delta}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Page views and downloads for the last 6 months
        </Typography>

        <Box sx={{ height: { xs: 150, sm: 200, md: 250 } }}>
          {Array.isArray(chartData) && chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
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
                {hasPageViews && (
                  <Bar dataKey="pageViews" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                )}
                {hasDownloads && (
                  <Bar dataKey="downloads" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
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