import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Box, Card, CardContent, useTheme, useMediaQuery, Button, ButtonGroup, Chip, Alert } from '@mui/material';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import RefreshIcon from '@mui/icons-material/Refresh';
import { analyticsAPI, usersAPI, ordersAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Enhanced Metric Card Component
const EnhancedMetricCard = ({ title, value, change, changeType, period, icon, color, chartData, chartType = 'line' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Handle change color based on type
  const changeColor = changeType === 'positive' ? '#22c55e' : 
                      changeType === 'negative' ? '#ef4444' : 
                      '#94a3b8'; // neutral gray
  
  const strokeColor = color || '#3b82f6';

  const renderChart = () => {
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) return null;

    // Ensure all data points are valid
    const validData = chartData.filter(d => d && typeof d === 'object');
    if (validData.length === 0) return null;

    const chartProps = {
      data: validData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <Bar dataKey="value" fill={strokeColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id={`colorGradient-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={strokeColor} fill={`url(#colorGradient-${strokeColor.replace('#', '')})`} strokeWidth={2} />
          </AreaChart>
        );
      default: // line
        return (
          <LineChart {...chartProps}>
            <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} dot={false} activeDot={false} />
          </LineChart>
        );
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        border: '1px solid #334155',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: '12px', 
              bgcolor: `${strokeColor}20`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              {icon}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="white">
            {value}
          </Typography>
          {change && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: changeColor,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {changeType === 'positive' && '↗'}
                {changeType === 'negative' && '↘'}
                {changeType === 'neutral' && '—'}
                {' '}{change}
              </Typography>
              {period && (
                <Typography variant="caption" color="text.secondary">
                  {period}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        
        <Box sx={{ height: 60, mt: 1 }} aria-hidden="true">
          {renderChart() && (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Enhanced Chart Card Component
const EnhancedChartCard = ({ title, children, height = 400 }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        border: '1px solid #334155',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      <CardContent sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: height, mt: 2 }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

// Pie Chart Component for Categories
const CategoryPieChart = ({ data, title }) => {
  const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#f97316'];

  return (
    <EnhancedChartCard title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155', 
              borderRadius: '8px',
              color: 'white'
            }} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </EnhancedChartCard>
  );
};

export default function EnhancedAnalyticsDashboard() {
  // Add accessibility features
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // 30 days, 90 days, 1 year
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Additional data for Users by Role and Trending Gadgets (from HomeOverview)
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load analytics data
      const res = await analyticsAPI.getDashboardStats(timeRange);
      if (res && res.data) {
        setAnalyticsData(res.data);
        setLastUpdated(new Date());
      }
      
      // Load users for role breakdown - pass adminUid
      try {
        const adminUid = user?.uid;
        const usersRes = await usersAPI.getAllUsers({ adminUid });
        if (usersRes?.success) {
          setUsers(usersRes.users || []);
        } else if (Array.isArray(usersRes)) {
          setUsers(usersRes);
        }
      } catch (e) {
        console.warn('Users fetch failed:', e?.message);
      }
      
      // Load orders for trending gadgets
      try {
        const ordersRes = await ordersAPI.getAllOrders();
        if (ordersRes?.success) {
          setOrders(ordersRes.orders || []);
        } else if (Array.isArray(ordersRes)) {
          setOrders(ordersRes);
        }
      } catch (e) {
        console.warn('Orders fetch failed:', e?.message);
      }
    } catch (e) {
      console.error('❌ Error loading analytics:', e);
      setError(e.message || 'Failed to load analytics data');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  // Prepare data for charts - using REAL data from backend only
  const visitorsData = React.useMemo(() => {
    if (!analyticsData?.visitor_stats || loading) return [];
    // Create trend from actual period data
    const today = analyticsData.visitor_stats.visitors_today || 0;
    const week = analyticsData.visitor_stats.visitors_this_week || 0;
    const month = analyticsData.visitor_stats.visitors_this_month || 0;
    return [
      { name: 'Today', value: today },
      { name: 'This Week', value: week },
      { name: 'This Month', value: month },
    ];
  }, [analyticsData, loading]);

  const pageViewsDownloadsData = React.useMemo(() => {
    if (!analyticsData?.visitor_stats || !analyticsData?.order_stats || loading) return [];
    return [
      { 
        name: 'Analytics', 
        pageViews: analyticsData.visitor_stats.page_views_month || 0,  // ✅ Real page views
        completedOrders: analyticsData.order_stats.completed_orders || 0  // ✅ Completed orders instead of "downloads"
      }
    ];
  }, [analyticsData, loading]);

  const ordersRevenueData = React.useMemo(() => {
    if (!analyticsData?.order_stats || !analyticsData?.revenue_stats || loading) return [];
    const mwkTotal = analyticsData.revenue_stats?.mwk?.total || 0;
    const gbpTotal = analyticsData.revenue_stats?.gbp?.total || 0;
    return [
      { 
        name: 'Total', 
        orders: analyticsData.order_stats.total_orders || 0, 
        revenueMWK: mwkTotal,  // ✅ MWK revenue
        revenueGBP: gbpTotal * 1800  // ✅ GBP converted to MWK scale for comparison
      }
    ];
  }, [analyticsData, loading]);

  // Category data - using REAL data from backend
  const categoryData = React.useMemo(() => {
    if (!analyticsData?.gadget_stats || loading) return [];
    const stats = analyticsData.gadget_stats;
    return [
      { name: 'Smartphones', value: stats.smartphones_count || 0 },
      { name: 'Laptops', value: stats.laptops_count || 0 },
      { name: 'Tablets', value: stats.tablets_count || 0 },
      { name: 'Accessories', value: stats.accessories_count || 0 }
    ].filter(item => item.value > 0);
  }, [analyticsData, loading]);

  // Users by role data (embedded from HomeOverview)
  const usersRoleData = React.useMemo(() => {
    const counts = { admin: 0, seller: 0, buyer: 0 };
    (users || []).forEach((u) => {
      const role = (u?.userRole || u?.role || '').toLowerCase();
      if (role.includes('admin')) counts.admin += 1;
      else if (role.includes('seller')) counts.seller += 1;
      else counts.buyer += 1;
    });
    return [
      { name: 'Admins', value: counts.admin },
      { name: 'Sellers', value: counts.seller },
      { name: 'Buyers', value: counts.buyer },
    ];
  }, [users]);

  // Trending gadgets from orders (embedded from HomeOverview)
  const trendingGadgetsData = React.useMemo(() => {
    const counts = new Map();
    orders.forEach((order) => {
      (order.items || []).forEach((it) => {
        const key = it?.name || `${it?.brand || ''} ${it?.model || ''}`.trim();
        const q = Number(it?.quantity || 1);
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + q);
      });
    });
    const arr = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 5);
  }, [orders]);

  // Helper function to calculate real percentage change
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) {
      // If no previous data, don't show fake percentages
      return { change: null, changeType: 'neutral' };
    }
    const diff = current - previous;
    const percentChange = ((diff / previous) * 100).toFixed(1);
    const isPositive = diff >= 0;
    return {
      change: `${isPositive ? '+' : ''}${percentChange}%`,
      changeType: isPositive ? 'positive' : 'negative'
    };
  };

  // Metric cards data
  const metricCards = React.useMemo(() => {
    if (!analyticsData) return [];
    
    // Calculate real changes from week vs month data
    const visitorsChange = calculateChange(
      analyticsData?.visitor_stats?.visitors_this_month || 0,
      analyticsData?.visitor_stats?.visitors_previous_month || 0
    );
    
    const pageViewsChange = calculateChange(
      analyticsData?.visitor_stats?.page_views_month || 0,
      analyticsData?.visitor_stats?.page_views_previous_month || 0
    );
    
    const productViewsChange = calculateChange(
      analyticsData?.visitor_stats?.product_views_month || 0,
      analyticsData?.visitor_stats?.product_views_previous_month || 0
    );
    
    const ordersChange = calculateChange(
      analyticsData?.order_stats?.orders_this_month || 0,
      analyticsData?.order_stats?.orders_previous_month || 0
    );
    
    const revenueMwkChange = calculateChange(
      analyticsData?.revenue_stats?.mwk?.this_month || 0,
      analyticsData?.revenue_stats?.mwk?.previous_month || 0
    );
    
    const revenueGbpChange = calculateChange(
      analyticsData?.revenue_stats?.gbp?.this_month || 0,
      analyticsData?.revenue_stats?.gbp?.previous_month || 0
    );
    
    // Calculate dispatched orders change
    const dispatchedChange = calculateChange(
      analyticsData?.order_stats?.dispatched_this_month || 0,
      analyticsData?.order_stats?.dispatched_previous_month || 0
    );
    
    // Calculate stock units change
    const stockChange = calculateChange(
      analyticsData?.gadget_stats?.total_stock_units || 0,
      analyticsData?.gadget_stats?.total_stock_units_previous || 0
    );
    
    return [
    {
      title: 'Total Visitors',
      value: analyticsData?.visitor_stats?.total_unique_visitors || 0,
      change: visitorsChange.change || 'No data',
      changeType: visitorsChange.changeType,
      period: visitorsChange.change ? 'vs last month' : '',
      icon: <PeopleIcon sx={{ fontSize: 24, color: '#3b82f6' }} />,
      color: '#3b82f6',
      chartData: visitorsData,
      chartType: 'area'
    },
    {
      title: 'Page Views',
      value: analyticsData?.visitor_stats?.page_views_month || 0,
      change: pageViewsChange.change || 'No data',
      changeType: pageViewsChange.changeType,
      period: pageViewsChange.change ? 'vs last month' : '',
      icon: <VisibilityIcon sx={{ fontSize: 24, color: '#10b981' }} />,
      color: '#10b981',
      chartData: visitorsData,
      chartType: 'line'
    },
    {
      title: 'Product Views',
      value: analyticsData?.visitor_stats?.product_views_month || 0,
      change: productViewsChange.change || 'No data',
      changeType: productViewsChange.changeType,
      period: productViewsChange.change ? 'vs last month' : '',
      icon: <TouchAppIcon sx={{ fontSize: 24, color: '#ec4899' }} />,
      color: '#ec4899',
      chartData: visitorsData,
      chartType: 'area'
    },
    {
      title: 'Total Orders',
      value: analyticsData?.order_stats?.total_orders || 0,
      change: ordersChange.change || 'No data',
      changeType: ordersChange.changeType,
      period: ordersChange.change ? 'vs last month' : '',
      icon: <ShoppingCartIcon sx={{ fontSize: 24, color: '#06b6d4' }} />,
      color: '#06b6d4',
      chartData: ordersRevenueData.map(d => ({ name: d.name, value: d.orders })),
      chartType: 'line'
    },
    {
      title: 'Revenue (MWK)',
      value: analyticsData?.revenue_stats?.mwk?.total ? `MWK ${(analyticsData.revenue_stats.mwk.total).toLocaleString()}` : 'MWK 0',
      change: revenueMwkChange.change || 'No data',
      changeType: revenueMwkChange.changeType,
      period: revenueMwkChange.change ? 'vs last month' : '',
      icon: <AccountBalanceIcon sx={{ fontSize: 24, color: '#8b5cf6' }} />,
      color: '#8b5cf6',
      chartData: ordersRevenueData.map(d => ({ name: d.name, value: d.revenue })),
      chartType: 'area'
    },
    {
      title: 'Revenue (GBP)',
      value: analyticsData?.revenue_stats?.gbp?.total ? `GBP ${(analyticsData.revenue_stats.gbp.total).toFixed(2)}` : 'GBP 0.00',
      change: revenueGbpChange.change || 'No data',
      changeType: revenueGbpChange.changeType,
      period: revenueGbpChange.change ? 'vs last month' : '',
      icon: <AccountBalanceIcon sx={{ fontSize: 24, color: '#f59e0b' }} />,
      color: '#f59e0b',
      chartData: visitorsData,
      chartType: 'line'
    },
    {
      title: 'Orders Dispatched',
      value: analyticsData?.order_stats?.dispatched_orders || 0,
      change: dispatchedChange.change || 'No data',
      changeType: dispatchedChange.changeType,
      period: dispatchedChange.change ? 'vs last month' : '',
      icon: <LocalShippingIcon sx={{ fontSize: 24, color: '#14b8a6' }} />,
      color: '#14b8a6',
      chartData: ordersRevenueData.map(d => ({ name: d.name, value: d.orders })),
      chartType: 'bar'
    },
    {
      title: 'Stock Units',
      value: analyticsData?.gadget_stats?.total_stock_units || 0,
      change: stockChange.change || 'No data',
      changeType: stockChange.changeType,
      period: stockChange.change ? 'vs last month' : '',
      icon: <InventoryIcon sx={{ fontSize: 24, color: '#f97316' }} />,
      color: '#f97316',
      chartData: categoryData.map(d => ({ name: d.name, value: d.value })),
      chartType: 'bar'
    }
  ];
  }, [loading, analyticsData, visitorsData, ordersRevenueData, categoryData]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h4" fontWeight="bold" gutterBottom color="white">
          Loading Analytics...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="white" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive insights and metrics for your platform
            </Typography>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAnalytics}
            disabled={loading}
            sx={{
              borderColor: '#3b82f6',
              color: '#3b82f6',
              '&:hover': {
                borderColor: '#2563eb',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            Refresh Data
          </Button>
        </Box>
        
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Time Range Selector */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Time Range:
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                sx={{
                  borderColor: timeRange === range ? '#3b82f6' : '#334155',
                  backgroundColor: timeRange === range ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: timeRange === range ? '#3b82f6' : '#94a3b8',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                {range}
              </Button>
            ))}
          </ButtonGroup>
          
          {/* Cache Status Indicator */}
          {analyticsData?.cache_status && (
            <Chip
              label={`Cache: ${analyticsData.cache_status}`}
              size="small"
              color={analyticsData.cache_status === 'fresh' ? 'success' : 'warning'}
              sx={{ ml: 2 }}
            />
          )}
        </Box>
      </Box>

      {/* Metric Cards Grid - Organized by Category */}
      <Box sx={{ mb: 4 }}>
        {/* Visitor & Engagement Metrics */}
        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom sx={{ mb: 2 }}>
          Visitor & Engagement
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricCards.slice(0, 3).map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <EnhancedMetricCard {...card} />
            </Grid>
          ))}
        </Grid>

        {/* Sales & Revenue Metrics */}
        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom sx={{ mb: 2 }}>
          Sales & Revenue
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricCards.slice(3, 6).map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <EnhancedMetricCard {...card} />
            </Grid>
          ))}
        </Grid>

        {/* Operations Metrics */}
        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom sx={{ mb: 2 }}>
          Operations & Inventory
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricCards.slice(6).map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <EnhancedMetricCard {...card} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <EnhancedChartCard title="Visitors Overview" height={350}>
            {!loading && visitorsData && visitorsData.length > 0 && analyticsData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitorsData}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorUv)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No visitor data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <CategoryPieChart data={categoryData} title="Product Categories" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <EnhancedChartCard title="Page Views & Completed Orders" height={350}>
            {!loading && pageViewsDownloadsData && pageViewsDownloadsData.length > 0 && analyticsData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pageViewsDownloadsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="pageViews" fill="#3b82f6" name="Page Views" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedOrders" fill="#10b981" name="Completed Orders" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <EnhancedChartCard title="Orders & Revenue (MWK)" height={350}>
            {!loading && ordersRevenueData && ordersRevenueData.length > 0 && analyticsData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#94a3b8" label={{ value: 'Orders', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" label={{ value: 'Revenue (MWK)', angle: 90, position: 'insideRight', fill: '#8b5cf6' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value, name) => {
                      if (name === 'Revenue (MWK)' || name === 'Revenue (GBP equiv)') {
                        return `MWK ${value.toLocaleString()}`;
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#06b6d4" name="Orders" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenueMWK" stroke="#8b5cf6" name="Revenue (MWK)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
      </Grid>      {/* Additional Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <EnhancedChartCard title="Conversion Rate" height={300}>
            {analyticsData?.conversion_stats ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="h4" sx={{ color: '#10b981', mb: 2, fontWeight: 'bold' }}>
                  {analyticsData.conversion_stats.overall_conversion_rate}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Overall Conversion Rate
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8', mb: 1 }}>
                    Conversion Funnel (Last 30 Days)
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    👁️ Page Viewers: <strong>{analyticsData.conversion_stats.total_page_viewers?.toLocaleString() || 0}</strong>
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, pl: 1 }}>
                    ↳ Product Viewers: <strong>{analyticsData.conversion_stats.total_product_viewers?.toLocaleString() || 0}</strong>
                    <span style={{ color: '#10b981', marginLeft: '8px' }}>
                      ({analyticsData.conversion_stats.view_to_product_rate || 0}%)
                    </span>
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, pl: 2 }}>
                    ↳ Added to Cart: <strong>{analyticsData.conversion_stats.cart_users?.toLocaleString() || 0}</strong>
                    <span style={{ color: '#10b981', marginLeft: '8px' }}>
                      ({analyticsData.conversion_stats.product_to_cart_rate || 0}%)
                    </span>
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, pl: 3 }}>
                    ↳ Started Checkout: <strong>{analyticsData.conversion_stats.checkout_users?.toLocaleString() || 0}</strong>
                    <span style={{ color: '#10b981', marginLeft: '8px' }}>
                      ({analyticsData.conversion_stats.cart_to_checkout_rate || 0}%)
                    </span>
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                    ✅ Completed Orders: <strong>{analyticsData.conversion_stats.completed_orders?.toLocaleString() || 0}</strong>
                    <span style={{ color: '#10b981', marginLeft: '8px' }}>
                      ({analyticsData.conversion_stats.checkout_to_order_rate || 0}%)
                    </span>
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No conversion data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <EnhancedChartCard title="Stock Status" height={300}>
            {analyticsData?.gadget_stats ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#10b981', fontWeight: 'bold' }}>
                  {analyticsData.gadget_stats.active_gadgets || 0} / {analyticsData.gadget_stats.total_gadgets || 0} Active
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>In Stock: {analyticsData.gadget_stats.in_stock_gadgets || 0}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Low Stock: {analyticsData.gadget_stats.low_stock_gadgets || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Out of Stock: {analyticsData.gadget_stats.out_of_stock_gadgets || 0}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Units: {analyticsData.gadget_stats.total_stock_units || 0}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No stock data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <EnhancedChartCard title="Subscription Status" height={300}>
            {analyticsData?.subscription_stats ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#ec4899', fontWeight: 'bold' }}>
                  {analyticsData.subscription_stats.active_subscriptions || 0} Active
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Plus Subscribers: {analyticsData.subscription_stats.plus_subscribers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Premium Subscribers: {analyticsData.subscription_stats.premium_subscribers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Pending: {analyticsData.subscription_stats.pending_subscriptions || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Suspended: {analyticsData.subscription_stats.suspended_subscriptions || 0}</Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No subscription data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
      </Grid>

      {/* Users & Trending Section (embedded from Home) */}
      <Typography variant="h6" fontWeight="bold" color="white" sx={{ mt: 4, mb: 2 }}>
        Users & Trending
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Users by Role */}
        <Grid item xs={12} md={6}>
          <EnhancedChartCard title="Users by Role" height={280}>
            {usersRoleData && usersRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersRoleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No users data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
        
        {/* Trending Gadgets */}
        <Grid item xs={12} md={6}>
          <EnhancedChartCard title="Trending Gadgets" height={280}>
            {trendingGadgetsData && trendingGadgetsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendingGadgetsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#94a3b8" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                No trending gadgets data available
              </Box>
            )}
          </EnhancedChartCard>
        </Grid>
      </Grid>
    </Container>
  );
}