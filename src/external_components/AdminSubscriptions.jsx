import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useAuth } from '../contexts/AuthContext.jsx';
import { subscriptionsAPI, usersAPI } from '../services/api.js';

const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('active')) return 'success';
  if (s.includes('pending')) return 'warning';
  if (s.includes('suspend')) return 'error';
  return 'default';
};

export default function AdminSubscriptions() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState({});
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if user is loaded and has uid
      if (!user?.uid) {
        setError('Admin user not loaded. Please refresh.');
        setLoading(false);
        return;
      }
      
      // Pass adminUid to the API call
      const res = await usersAPI.getAllUsers({ role: 'buyer', adminUid: user.uid });
      
      // Handle different response structures
      const list = res?.data || res?.users || res || [];
      setUsers(Array.isArray(list) ? list : []);
      const nextSubs = {};
      for (const u of list) {
        const userKey = u.uid || u.id || u.user_uid;
        // Skip if no valid uid
        if (!userKey) {
          nextSubs[`unknown_${Math.random()}`] = { error: true, message: 'No UID' };
          continue;
        }
        try {
          const st = await subscriptionsAPI.getStatus(userKey);
          nextSubs[userKey] = st;
        } catch (e) {
          console.error(`Failed to get subscription status for ${userKey}:`, e);
          nextSubs[userKey] = { error: true, message: e.message || 'Failed to load' };
        }
      }
      setSubs(nextSubs);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return users;
    const f = filter.toLowerCase();
    return users.filter((u) =>
      (u.email || '').toLowerCase().includes(f) ||
      (u.full_name || '').toLowerCase().includes(f) ||
      String(u.uid || u.id || '').toLowerCase().includes(f)
    );
  }, [users, filter]);

  const handleCancel = async (uid) => {
    try {
      await subscriptionsAPI.cancel(uid);
      await load();
    } catch (e) {
      setError(e.message || 'Cancel failed');
    }
  };

  const handleRenewPaychangu = async (uid, tier) => {
    try {
      await subscriptionsAPI.renewWithPaychangu({ userUid: uid, tier });
      await load();
    } catch (e) {
      setError(e.message || 'Renewal failed');
    }
  };

  if (!isAdmin()) return null;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700} color="white">Subscriptions (Admin)</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search email or UID"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ bgcolor: 'white', minWidth: 220 }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={loading}
            sx={{ color: '#48cedb', borderColor: '#48cedb' }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <Paper sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>UID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Gateway</TableCell>
                  <TableCell>Renewal Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((u) => {
                  const key = u.uid || u.id;
                  const s = subs[key] || {};
                  const tier = s.tier || s.subscription_tier;
                  const gateway = s.gateway || s.subscription_payment_gateway;
                  const renewal = s.renewal_date || s.subscription_renewal_date || '-';
                  return (
                    <TableRow key={key} hover>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{key}</TableCell>
                      <TableCell>
                        {s.error ? (
                          <Chip
                            label={s.message || 'Error'}
                            color="error"
                            size="small"
                          />
                        ) : (
                          <Chip
                            label={s.status || s.subscription_status || 'N/A'}
                            color={statusColor(s.status || s.subscription_status)}
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>{(tier || '—').toString().toUpperCase()}</TableCell>
                      <TableCell>{(gateway || '—').toString().toUpperCase()}</TableCell>
                      <TableCell>{renewal ? String(renewal).slice(0, 10) : '—'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title={s.error ? 'Cannot manage - error loading subscription' : 'Cancel subscription'}>
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={() => handleCancel(key)}
                                disabled={s.error}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={s.error ? 'Cannot manage - error loading subscription' : 'Renew via PayChangu (manual invoice)'}>
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={() => handleRenewPaychangu(key, tier || 'plus')}
                                disabled={s.error}
                              >
                                <ReplayIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
