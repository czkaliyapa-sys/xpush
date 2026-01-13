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
  Stack,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useAuth } from '../contexts/AuthContext.jsx';
import { tradeInAPI } from '../services/api.js';

const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'approved' || s === 'completed') return 'success';
  if (s === 'pending' || s === 'under_review') return 'warning';
  if (s === 'rejected' || s === 'cancelled') return 'error';
  return 'default';
};

const offerTypeColor = (offerType) => {
  const type = (offerType || '').toLowerCase();
  if (type === 'cash_only') return 'success';
  if (type === 'swap_only') return 'info';
  if (type === 'both') return 'secondary';
  return 'default';
};

const offerTypeLabel = (offerType) => {
  const type = (offerType || '').toLowerCase();
  if (type === 'cash_only') return '💵 Cash Only';
  if (type === 'swap_only') return '🔄 Swap Only';
  if (type === 'both') return '🔄💵 Both';
  return offerType;
};

const statuses = [
  'pending',
  'under_review',
  'approved',
  'rejected',
  'completed',
  'cancelled'
];

const offerTypes = [
  { value: 'cash_only', label: '💵 Cash Only' },
  { value: 'swap_only', label: '🔄 Swap Only' },
  { value: 'both', label: '🔄💵 Both' }
];

export default function AdminTradeIns() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [edit, setEdit] = useState(null); // {reference, status, finalValue, notes}
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tradeInAPI.adminList();
      const list = res?.tradeIns || res?.data || res || [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || 'Failed to load trade-ins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) load();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return rows;
    const f = filter.toLowerCase();
    return rows.filter((r) =>
      (r.customer_email || '').toLowerCase().includes(f) ||
      (r.customer_name || '').toLowerCase().includes(f) ||
      (r.reference || '').toLowerCase().includes(f)
    );
  }, [rows, filter]);

  const openEdit = (row) => {
    setEdit({
      reference: row.reference,
      status: row.status,
      offerType: row.offer_type || 'cash_only',
      finalValue: row.final_value,
      notes: ''
    });
  };

  const save = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await tradeInAPI.adminUpdate(edit);
      setEdit(null);
      await load();
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin()) return null;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700} color="white">Trade-Ins (Admin)</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search reference, email, name"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ bgcolor: 'white', minWidth: 240 }}
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
                  <TableCell>Reference</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Offer Type</TableCell>
                  <TableCell>Est.</TableCell>
                  <TableCell>Final</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.reference} hover>
                    <TableCell>{r.reference}</TableCell>
                    <TableCell>{r.customer_name}</TableCell>
                    <TableCell>{r.customer_email}</TableCell>
                    <TableCell>{`${r.device_brand || ''} ${r.device_model || ''}`}</TableCell>
                    <TableCell>
                      <Chip 
                        label={offerTypeLabel(r.offer_type)} 
                        color={offerTypeColor(r.offer_type)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{r.estimated_value ? `MWK ${Number(r.estimated_value).toLocaleString()}` : '—'}</TableCell>
                    <TableCell>{r.final_value ? `MWK ${Number(r.final_value).toLocaleString()}` : '—'}</TableCell>
                    <TableCell>
                      <Chip label={r.status} color={statusColor(r.status)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => openEdit(r)} startIcon={<PendingActionsIcon />}>
                          Update
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={!!edit} onClose={() => setEdit(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Trade-In</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Reference" value={edit?.reference || ''} InputProps={{ readOnly: true }} />
          <TextField
            select
            label="Status"
            value={edit?.status || ''}
            onChange={(e) => setEdit({ ...edit, status: e.target.value })}
          >
            {statuses.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Offer Type"
            value={edit?.offerType || 'cash_only'}
            onChange={(e) => setEdit({ ...edit, offerType: e.target.value })}
            helperText="Determines how customer receives value (cash, swap, or both)"
          >
            {offerTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Final Value (MWK)"
            type="number"
            value={edit?.finalValue ?? ''}
            onChange={(e) => setEdit({ ...edit, finalValue: e.target.value })}
          />
          <TextField
            label="Notes (append)"
            multiline
            minRows={3}
            value={edit?.notes || ''}
            onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
