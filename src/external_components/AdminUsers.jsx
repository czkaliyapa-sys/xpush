import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  CircularProgress,
  Alert,
  Toolbar,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  LinearProgress,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  PersonOff as PersonOffIcon,
  PersonAddAlt as PersonAddAltIcon,
  PersonRemove as PersonRemoveIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  SupervisedUserCircle as SupervisedUserCircleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  ShoppingCart as ShoppingCartIcon,
  AccessTime as AccessTimeIcon,
  AccountBalance as AccountBalanceIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Title from './Title';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usersAPI, ordersAPI, installmentsAPI } from '../services/api.js';

export default function AdminUsers() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [filters, setFilters] = useState({ role: '', active: '', verifiedSeller: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState(null);
  const adminUid = user?.uid || user?.id || null;

  const roleOptions = [
    { value: '', label: 'All roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'seller', label: 'Seller' },
    { value: 'buyer', label: 'Buyer' }
  ];

  const activeOptions = [
    { value: '', label: 'All statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  const verifiedOptions = [
    { value: '', label: 'All sellers' },
    { value: 'true', label: 'Verified sellers only' },
    { value: 'false', label: 'Unverified sellers only' }
  ];

  const parsedFilters = useMemo(() => ({
    role: filters.role || undefined,
    active: filters.active === '' ? undefined : filters.active === 'true',
    verifiedSeller: filters.verifiedSeller === '' ? undefined : filters.verifiedSeller === 'true',
    adminUid
  }), [filters, adminUid]);

  useEffect(() => {
    if (!isAdmin()) return;
    
    const fetchAnalytics = async () => {
      try {
        // Calculate analytics data based on current users
        const userStats = users.reduce((acc, u) => {
          acc.total++;
          if (u.active ?? u.isActive ?? true) acc.active++;
          else acc.inactive++;
          
          if (u.userRole === 'admin') acc.admin++;
          else if (u.userRole === 'seller') {
            acc.seller++;
            if (u.verifiedSeller) acc.verifiedSeller++;
          }
          else if (u.userRole === 'buyer') acc.buyer++;
          
          return acc;
        }, { total: 0, active: 0, inactive: 0, admin: 0, seller: 0, verifiedSeller: 0, buyer: 0 });
        
        // Generate mock activity data (in real app this would come from API)
        const activityData = [
          { date: '2024-01', newUsers: 12, activeUsers: 45 },
          { date: '2024-02', newUsers: 19, activeUsers: 52 },
          { date: '2024-03', newUsers: 15, activeUsers: 48 },
          { date: '2024-04', newUsers: 22, activeUsers: 60 },
          { date: '2024-05', newUsers: 18, activeUsers: 55 },
          { date: '2024-06', newUsers: 25, activeUsers: 68 },
        ];
        
        // Generate role distribution
        const roleDistribution = [
          { name: 'Buyers', value: userStats.buyer },
          { name: 'Sellers', value: userStats.seller },
          { name: 'Admins', value: userStats.admin },
        ];
        
        setAnalyticsData({
          userStats,
          activityData,
          roleDistribution
        });
      } catch (e) {
        console.error('Error calculating analytics:', e);
      }
    };
    
    fetchAnalytics();
  }, [users, isAdmin]);

  useEffect(() => {
    if (!isAdmin()) return;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = await usersAPI.getAllUsers(parsedFilters);
        if (res?.success) {
          setUsers(res.users || res.data || []);
        } else {
          throw new Error(res?.error || 'Failed to fetch users');
        }
      } catch (e) {
        const status = e?.response?.status;
        const endpointPath = '/admin/users';
        console.error('Admin users fetch error:', { error: e, status, endpointPath });
        let message;
        if (status === 404) {
          message = `Users API endpoint not found (404) for ${endpointPath}.`;
        } else if (status === 401 || status === 403) {
          message = `Access denied (${status}). Please ensure you are logged in with admin permissions.`;
        } else if (status >= 500) {
          message = `Server error (${status}). Please try again later.`;
        } else if (!status && e?.message?.includes('Network')) {
          message = 'Network error while contacting the API.';
        } else {
          message = e?.message || 'Failed to fetch users';
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [parsedFilters, isAdmin]);

  const openDetails = async (u) => {
    setSelectedUser(null);
    setDetailOpen(true);
    try {
      const res = await usersAPI.getUserDetail(u.uid || u.id, adminUid);
      if (res?.success) {
        setSelectedUser(res.user || res.data || u);
      } else {
        setSelectedUser(u);
        setNotice('Could not load full details from API; showing list data.');
      }
    } catch (e) {
      console.error('User detail load error:', e);
      setSelectedUser(u);
      setNotice('Could not load full details from API; showing list data.');
    }
  };

  const performAction = async (uid, action) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (action === 'deactivate') res = await usersAPI.deactivate(uid, adminUid, 'Admin deactivation');
      else if (action === 'reactivate') res = await usersAPI.reactivate(uid, adminUid);
      else if (action === 'close') res = await usersAPI.close(uid, adminUid, 'Account closure by admin');
      else throw new Error('Unknown action');
      if (res?.success) {
        // Refresh list
        const listRes = await usersAPI.getAllUsers(parsedFilters);
        setUsers(listRes.users || listRes.data || []);
      } else {
        throw new Error(res?.error || 'Action failed');
      }
    } catch (e) {
      console.error('Admin action error:', e);
      setError(e?.message || 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const MetricCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color || 'primary.main'}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color || 'primary.main', width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <React.Fragment>
      <Title>Admin Dashboard - Users</Title>
      
      {/* Analytics Dashboard */}
      {analyticsData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Total Users"
              value={analyticsData.userStats.total}
              icon={<PersonIcon />}
              color="primary.main"
              subtitle="All registered users"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Active Users"
              value={analyticsData.userStats.active}
              icon={<CheckCircleIcon />}
              color="success.main"
              subtitle="Currently active accounts"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Verified Sellers"
              value={analyticsData.userStats.verifiedSeller}
              icon={<VerifiedIcon />}
              color="info.main"
              subtitle="Verified seller accounts"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="User Growth"
              value="+15%"
              icon={<TrendingUpIcon />}
              color="secondary.main"
              subtitle="From last month"
            />
          </Grid>
          
          {/* Charts Section */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: 300, p: 2 }}>
              <CardHeader title="User Activity Overview" />
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={analyticsData.activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#8884d8" fill="#8884d8" name="New Users" />
                  <Area type="monotone" dataKey="activeUsers" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Active Users" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 300, p: 2 }}>
              <CardHeader title="User Roles Distribution" />
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={analyticsData.roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Tabs for different admin tools */}
      <Paper sx={{ p: 0, mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin tools tabs">
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="User Management" />
          <Tab icon={<SupervisedUserCircleIcon />} iconPosition="start" label="User Analytics" />
          <Tab icon={<AccountBalanceIcon />} iconPosition="start" label="Account Actions" />
          <Tab icon={<MonetizationOnIcon />} iconPosition="start" label="Installment Management" />
        </Tabs>
      </Paper>
      
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Toolbar sx={{ px: 0 }}>
            <TextField
              select
              size="small"
              label="Role"
              value={filters.role}
              onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
              sx={{ mr: 2, minWidth: 180 }}
            >
              {roleOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={filters.active}
              onChange={(e) => setFilters(f => ({ ...f, active: e.target.value }))}
              sx={{ mr: 2, minWidth: 180 }}
            >
              {activeOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Seller Verification"
              value={filters.verifiedSeller}
              onChange={(e) => setFilters(f => ({ ...f, verifiedSeller: e.target.value }))}
              sx={{ mr: 2, minWidth: 220 }}
            >
              {verifiedOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Toolbar>
          <Divider sx={{ my: 1 }} />
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          {!loading && !error && (
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>UID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Seller</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.uid || u.id} hover>
                      <TableCell>{u.uid || u.id}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">{u.fullName || u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}</Typography>
                          <Tooltip title="View info">
                            <IconButton size="small" onClick={() => openDetails(u)}>
                              <InfoIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell>{u.email || '—'}</TableCell>
                      <TableCell>{u.phone || u.phoneNumber || u.mobile || '—'}</TableCell>
                      <TableCell>
                        <Chip label={u.userRole || u.role || 'buyer'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={(u.active ?? u.isActive ?? true) ? 'active' : 'inactive'} color={(u.active ?? u.isActive ?? true) ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={u.isSeller ? (u.verifiedSeller ? 'verified' : 'seller') : '—'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Deactivate">
                          <span>
                            <IconButton size="small" onClick={() => performAction(u.uid || u.id, 'deactivate')} disabled={(u.active ?? u.isActive ?? true) === false}>
                              <PersonRemoveIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reactivate">
                          <span>
                            <IconButton size="small" onClick={() => performAction(u.uid || u.id, 'reactivate')} disabled={(u.active ?? u.isActive ?? true) === true}>
                              <PersonAddAltIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Close account">
                          <IconButton size="small" color="error" onClick={() => performAction(u.uid || u.id, 'close')}>
                            <PersonOffIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </TableContainer>
          )}
        </Paper>
      )}
      
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Advanced User Analytics</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>User Engagement</Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Detailed analytics on user activity, session duration, and engagement metrics.
                  </Typography>
                  <LinearProgress variant="determinate" value={75} />
                  <Typography variant="caption">75% engagement rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Account Verification</Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Verification status and seller approval rates across different user segments.
                  </Typography>
                  <LinearProgress variant="determinate" value={60} />
                  <Typography variant="caption">60% verification rate</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Account Management Actions</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <CancelIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Account Closures</Typography>
                      <Typography variant="body2" color="textSecondary">Manage account closure requests</Typography>
                    </Box>
                  </Stack>
                  <Button variant="outlined" color="error" sx={{ mt: 2 }}>Review Closures</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <AccessTimeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Pending Approvals</Typography>
                      <Typography variant="body2" color="textSecondary">Seller and content approvals</Typography>
                    </Box>
                  </Stack>
                  <Button variant="outlined" color="warning" sx={{ mt: 2 }}>Review Approvals</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <MonetizationOnIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Financial Actions</Typography>
                      <Typography variant="body2" color="textSecondary">Refunds, disputes, and billing</Typography>
                    </Box>
                  </Stack>
                  <Button variant="outlined" color="success" sx={{ mt: 2 }}>Manage Finances</Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Installment Management</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <MonetizationOnIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Active Installments</Typography>
                      <Typography variant="body2" color="textSecondary">Total ongoing payment plans</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="h4" sx={{ mt: 1 }}>0</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <AccessTimeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Overdue Payments</Typography>
                      <Typography variant="body2" color="textSecondary">Installments past due date</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="h4" sx={{ mt: 1 }}>0</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Completed Plans</Typography>
                      <Typography variant="body2" color="textSecondary">Successfully completed installments</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="h4" sx={{ mt: 1 }}>0</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Card sx={{ mt: 3 }}>
            <CardHeader title="Recent Installment Activity" />
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                Installment management features coming soon. Currently managed through the Installments section.
              </Alert>
              <Typography variant="body2" color="textSecondary">
                Admins can manage installment plans, track payments, and send notifications to users about due payments.
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      )}

      <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)}>
        <Box sx={{ width: 380, p: 2 }} role="presentation">
          <Typography variant="h6" sx={{ mb: 1 }}>User Details</Typography>
          <Divider sx={{ mb: 2 }} />
          {!selectedUser ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List dense>
              {/* Exclude password intentionally */}
              <ListItem><ListItemText primary="UID" secondary={selectedUser.uid || selectedUser.id} /></ListItem>
              {(selectedUser.fullName || selectedUser.displayName || selectedUser.firstName || selectedUser.lastName) && (
                <ListItem>
                  <ListItemText
                    primary="Name"
                    secondary={selectedUser.fullName || selectedUser.displayName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()}
                  />
                </ListItem>
              )}
              {selectedUser.email && (
                <ListItem><ListItemText primary="Email" secondary={selectedUser.email} /></ListItem>
              )}
              {selectedUser.phone && (
                <ListItem><ListItemText primary="Phone" secondary={selectedUser.phone} /></ListItem>
              )}
              {(selectedUser.address || selectedUser.location) && (
                <ListItem><ListItemText primary="Address" secondary={selectedUser.address || selectedUser.location} /></ListItem>
              )}
              {selectedUser.town && (
                <ListItem><ListItemText primary="Town/City" secondary={selectedUser.town} /></ListItem>
              )}
              {selectedUser.postcode && (
                <ListItem><ListItemText primary="Postcode" secondary={selectedUser.postcode} /></ListItem>
              )}
              {(selectedUser.userRole || selectedUser.role) && (
                <ListItem><ListItemText primary="Role" secondary={selectedUser.userRole || selectedUser.role} /></ListItem>
              )}
              {typeof (selectedUser.active ?? selectedUser.isActive) !== 'undefined' && (
                <ListItem><ListItemText primary="Status" secondary={(selectedUser.active ?? selectedUser.isActive) ? 'Active' : 'Inactive'} /></ListItem>
              )}
              {selectedUser.isSeller && (
                <ListItem><ListItemText primary="Seller" secondary={selectedUser.verifiedSeller ? 'Verified' : 'Unverified'} /></ListItem>
              )}
              {selectedUser.createdAt && (
                <ListItem><ListItemText primary="Created" secondary={new Date(selectedUser.createdAt).toLocaleString()} /></ListItem>
              )}
              {selectedUser.updatedAt && (
                <ListItem><ListItemText primary="Updated" secondary={new Date(selectedUser.updatedAt).toLocaleString()} /></ListItem>
              )}
              {selectedUser.lastLogin && (
                <ListItem><ListItemText primary="Last Login" secondary={new Date(selectedUser.lastLogin).toLocaleString()} /></ListItem>
              )}
              {selectedUser.notes && (
                <ListItem><ListItemText primary="Notes" secondary={selectedUser.notes} /></ListItem>
              )}
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => performAction(selectedUser.uid || selectedUser.id, 'deactivate')}>Deactivate</Button>
                <Button size="small" variant="outlined" onClick={() => performAction(selectedUser.uid || selectedUser.id, 'reactivate')}>Reactivate</Button>
                <Button size="small" color="error" variant="contained" onClick={() => performAction(selectedUser.uid || selectedUser.id, 'close')}>Close Account</Button>
              </Stack>
            </List>
          )}
        </Box>
      </Drawer>
    </React.Fragment>
  );
}