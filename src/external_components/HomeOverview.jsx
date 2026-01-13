import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Alert, CircularProgress, LinearProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { gadgetsAPI, ordersAPI, usersAPI } from '../services/api.js';
import { getPlatformStats } from '../services/verificationApi.js';
import SessionsChart from './SessionsChart';
import PageViewsChart from './PageViewsChart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Helper: safely parse order notes
const parseNotes = (notes) => {
  if (!notes) return null;
  if (typeof notes === 'object') return notes;
  try { return JSON.parse(notes); } catch { return null; }
};

// Colors for charts
const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#06b6d4', '#0ea5e9', '#a78bfa'];

// Compute monthly counts for bought vs paid (last 6 months)
const computeMonthlyOrderStats = (orders, months = 6) => {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ key, label: d.toLocaleString(undefined, { month: 'short' }), bought: 0, paid: 0 });
  }
  const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  orders.forEach((order) => {
    const created = order?.createdAt ? new Date(order.createdAt) : null;
    if (!created) return;
    const k = keyOf(created);
    const bucket = buckets.find((b) => b.key === k);
    if (!bucket) return;
    const itemsCount = Array.isArray(order.items) ? order.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0) : 1;
    bucket.bought += itemsCount;
    const status = (order?.paymentStatus || order?.status || '').toLowerCase();
    if (status.includes('paid')) bucket.paid += itemsCount;
  });
  return buckets.map(({ label, bought, paid }) => ({ name: label, bought, paid }));
};

// Compute trending gadgets from orders items
const computeTrendingFromOrders = (orders, topN = 5) => {
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
  return arr.slice(0, topN);
};

// Compute stock overview
const computeStockOverview = (gadgets) => {
  let inStock = 0; let outStock = 0;
  gadgets.forEach((g) => {
    const qty = Number(g?.stock_quantity ?? g?.stockQuantity ?? g?.stock ?? 0);
    const inStockFlag = typeof g?.in_stock !== 'undefined' ? (Number(g.in_stock) === 1) : (qty > 0);
    if (inStockFlag) inStock += qty || 1; else outStock += 1;
  });
  return [
    { name: 'In stock', value: inStock },
    { name: 'Out of stock', value: outStock },
  ];
};

// Compute installments pending vs completed from orders
const computeInstallmentsStats = (orders) => {
  let pending = 0; let completed = 0;
  orders.forEach((order) => {
    const notesObj = parseNotes(order?.notes);
    const isInstallment = !!(notesObj?.installmentPlan || notesObj?.paymentType === 'installment_deposit' || notesObj?.paymentType === 'installment_payment');
    if (!isInstallment) return;
    const status = (order?.paymentStatus || order?.status || '').toLowerCase();
    if (status.includes('paid')) completed += 1; else pending += 1;
  });
  return [
    { name: 'Pending', value: pending },
    { name: 'Completed', value: completed },
  ];
};

// Compute overall installment summary for the current user
const computeInstallmentsSummary = (orders) => {
  let plans = 0;
  let totalAmount = 0;
  let amountPaid = 0;
  let remainingAmount = 0;
  let soonestDays = null;
  orders.forEach((order) => {
    const notesObj = parseNotes(order?.notes);
    const plan = notesObj?.installmentPlan;
    const isInstallment = !!(plan || notesObj?.paymentType === 'installment_deposit' || notesObj?.paymentType === 'installment_payment');
    if (!isInstallment) return;
    plans += 1;
    const weeks = Number(plan?.weeks ?? 0);
    const weeklyAmount = Number(plan?.weeklyAmount ?? plan?.weekly_amount ?? 0);
    const deposit = Number(plan?.depositAmount ?? plan?.deposit_amount ?? 0);
    const paymentsMade = Number(plan?.paymentsMade ?? plan?.payments_made ?? 0);
    const paid = Number(plan?.amountPaid ?? plan?.amount_paid ?? (deposit + weeklyAmount * paymentsMade) ?? 0);
    const total = Number(plan?.totalAmount ?? plan?.total_amount ?? (deposit + weeklyAmount * weeks) ?? 0);
    const remaining = Math.max(total - paid, 0);
    amountPaid += paid;
    totalAmount += total;
    remainingAmount += remaining;
    const expiry = plan?.expiryDate || plan?.expiry_at || order?.expiryDate;
    const nextDue = plan?.nextDueDate || plan?.next_due_at || order?.nextDueDate;
    const refDateStr = expiry || nextDue;
    if (refDateStr) {
      const now = new Date();
      const refDate = new Date(refDateStr);
      const days = Math.ceil((refDate - now) / (24 * 60 * 60 * 1000));
      if (soonestDays == null || days < soonestDays) soonestDays = days;
    }
  });
  const percent = totalAmount > 0 ? Math.round((amountPaid / totalAmount) * 100) : 0;
  return { plans, totalAmount, amountPaid, remainingAmount, percent, soonestDays };
};

export default function HomeOverview() {
  const { user, isAdmin } = useAuth();
  const isAdminRole = isAdmin();
  const uid = user?.uid || user?.id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [gadgets, setGadgets] = useState([]);
  const [users, setUsers] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      let anySuccess = false;

      // Fetch gadgets for stock and trending
      try {
        const gadgetsRes = await gadgetsAPI.getAll();
        if (gadgetsRes?.success) {
          setGadgets(gadgetsRes.gadgets || gadgetsRes.data || []);
          anySuccess = true;
        } else {
          setGadgets(Array.isArray(gadgetsRes) ? gadgetsRes : []);
          if (Array.isArray(gadgetsRes)) anySuccess = true;
        }
      } catch (err) {
        console.warn('Gadgets fetch failed:', err?.message);
      }

      // Fetch orders depending on role
      try {
        let ordersRes;
        if (isAdminRole || uid === 'admin_system_default') {
          ordersRes = await ordersAPI.getAllOrders();
        } else if (uid) {
          ordersRes = await ordersAPI.getUserOrders(uid);
        }
        if (ordersRes?.success) {
          setOrders(ordersRes.orders || []);
          anySuccess = true;
        } else if (Array.isArray(ordersRes)) {
          setOrders(ordersRes);
          anySuccess = true;
        }
      } catch (err) {
        console.warn('Orders fetch failed:', err?.message);
      }

      // Fetch users if admin
      if (isAdminRole) {
        try {
          const usersRes = await usersAPI.getAllUsers({});
          if (usersRes?.success) {
            setUsers(usersRes.users || []);
            anySuccess = true;
          } else if (Array.isArray(usersRes)) {
            setUsers(usersRes);
            anySuccess = true;
          }
        } catch (err) {
          console.warn('Users fetch failed:', err?.message);
        }
      }

      // Try platform stats (admin only) if available
      if (isAdminRole) {
        try {
          const statsRes = await getPlatformStats();
          if (statsRes && (statsRes.success || statsRes.data)) {
            setPlatformStats(statsRes.data || statsRes.stats || statsRes);
            anySuccess = true;
          }
        } catch (e) {
          // Ignore if not available
          console.warn('Platform stats fetch failed');
        }
      }

      // Only surface a user-visible error if nothing loaded at all
      if (!anySuccess) {
        setError('Failed to load dashboard data');
      }

      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [isAdminRole, uid]);

  // Derived datasets
  const monthlyOrderStats = useMemo(() => computeMonthlyOrderStats(orders), [orders]);
  const trendingData = useMemo(() => {
    const fromOrders = computeTrendingFromOrders(orders);
    if (fromOrders.length > 0) return fromOrders;
    // Fallback: use gadgets stock as proxy for popularity
    return (gadgets || []).slice(0, 5).map((g) => ({ name: g?.name || g?.model || 'Gadget', value: Number(g?.stock_quantity ?? 0) }));
  }, [orders, gadgets]);
  const stockOverview = useMemo(() => computeStockOverview(gadgets), [gadgets]);
  const installmentsStats = useMemo(() => computeInstallmentsStats(orders), [orders]);
  const installmentsSummary = useMemo(() => computeInstallmentsSummary(orders), [orders]);

  // Users by role (approximation for "logged in" analysis)
  const usersRoleData = useMemo(() => {
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

  // Visitors stats if provided by platformStats
  const visitorsSeries = useMemo(() => {
    // Prefer platform stats if available
    const days = platformStats?.visitors?.daily || [];
    if (Array.isArray(days) && days.length) {
      return days.map((d) => ({ name: d?.day || '', value: Number(d?.count || 0) }));
    }
    // Fallback: approximate visitors from user signups (admin only)
    if (Array.isArray(users) && users.length) {
      const map = new Map();
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        map.set(key, { name: label, value: 0 });
      }
      users.forEach((u) => {
        const created = u?.createdAt ? new Date(u.createdAt) : null;
        if (!created) return;
        const key = created.toISOString().slice(0, 10);
        if (map.has(key)) {
          map.get(key).value += 1;
        }
      });
      return Array.from(map.values());
    }
    return [];
  }, [platformStats, users]);

  // Page views and downloads combined monthly data (best-effort extraction)
  const pageViewsDownloadsData = useMemo(() => {
    const normalize = (arr, key) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((d) => ({
        name: d?.month || d?.label || d?.day || '',
        [key]: Number(d?.count ?? d?.value ?? d?.[key] ?? 0),
      }));
    };
    // Preferred: platform stats if available
    const pvSrc = platformStats?.pageViews?.monthly || platformStats?.page_views?.monthly || platformStats?.pageViews || platformStats?.page_views || [];
    const dlSrc = platformStats?.downloads?.monthly || platformStats?.downloads || [];
    let pv = normalize(pvSrc, 'pageViews');
    let dl = normalize(dlSrc, 'downloads');

    // Fallback: derive from orders if platform stats are missing or empty
    const noPv = !Array.isArray(pv) || pv.length === 0;
    const noDl = !Array.isArray(dl) || dl.length === 0;
    if ((noPv || noDl) && Array.isArray(orders) && orders.length) {
      const last6 = computeMonthlyOrderStats(orders, 6);
      pv = last6.map((m) => ({ name: m.name, pageViews: Number(m.bought || 0) }));
      dl = last6.map((m) => ({ name: m.name, downloads: Number(m.paid || 0) }));
    }

    const months = Array.from(new Set([...(pv || []).map((x) => x.name), ...(dl || []).map((x) => x.name)])).filter(Boolean);
    const combined = months.map((m) => ({
      name: m,
      pageViews: (pv || []).find((x) => x.name === m)?.pageViews || 0,
      downloads: (dl || []).find((x) => x.name === m)?.downloads || 0,
    }));
    return combined.length ? combined : [];
  }, [platformStats, orders]);

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Admin: Site visitors + Page views */}
          {isAdminRole && (
            <>
              <Grid item xs={12} lg={6}>
                {/* Visitors (sessions) - use platform stats if available */}
                <SessionsChart title="Visitors" data={visitorsSeries} />
              </Grid>
              <Grid item xs={12} lg={6}>
                <PageViewsChart data={pageViewsDownloadsData} />
              </Grid>
              {/* Logged-in users by role */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Users by role
                    </Typography>
                    <Box sx={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usersRoleData}>
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {/* Gadgets bought vs paid (monthly) */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Gadgets bought vs paid (last 6 months)
                    </Typography>
                    <Box sx={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyOrderStats}>
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="bought" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="paid" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {/* Stock overview */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Stock overview
                    </Typography>
                    <Box sx={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stockOverview} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                            {stockOverview.map((entry, index) => (
                              <Cell key={`stock-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Regular user: Gadgets bought, Installments pending, Trending gadgets */}
          {!isAdminRole && (
            <>
              {/* My installments overview */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      My installments overview
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <Typography variant="body2" color="text.secondary">
                        Plans: {installmentsSummary.plans}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Remaining: MWK {new Intl.NumberFormat().format(Math.round(installmentsSummary.remainingAmount || 0))}
                      </Typography>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>Overall progress ({installmentsSummary.percent}% paid)</Typography>
                        <LinearProgress variant="determinate" value={installmentsSummary.percent} sx={{ height: 10, borderRadius: 5 }} />
                      </Box>
                      {typeof installmentsSummary.soonestDays === 'number' && (
                        <Typography variant="caption" color={installmentsSummary.soonestDays < 0 ? 'error' : 'text.secondary'}>
                          Next due in {installmentsSummary.soonestDays < 0 ? `${Math.abs(installmentsSummary.soonestDays)} days overdue` : `${installmentsSummary.soonestDays} days`}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {/* Gadgets bought by month */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      My gadgets bought (last 6 months)
                    </Typography>
                    <Box sx={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyOrderStats}>
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="bought" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {/* Installments pending vs completed */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Installments status
                    </Typography>
                    <Box sx={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={installmentsStats} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                            {installmentsStats.map((entry, index) => (
                              <Cell key={`inst-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Trending gadgets (both user and admin) */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Trending gadgets
                </Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendingData}>
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} angle={-10} height={60} />
                      <YAxis tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}