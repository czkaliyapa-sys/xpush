import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useAuth } from '../contexts/AuthContext.jsx';
import { installmentsAPI } from '../services/api.js';

const statusColor = {
  pending: 'warning',
  under_review: 'info',
  documents_requested: 'default',
  approved: 'success',
  denied: 'error',
  cancelled: 'default'
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const ApplicationDetail = ({ application }) => {
  if (!application) return null;
  const { gadget = {}, variant = {}, plan = {}, personal = {}, employment = {} } = application;

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Product</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2"><strong>Name:</strong> {gadget.name || '—'}</Typography>
            <Typography variant="body2"><strong>Variant:</strong> {variant.storage || '—'} {variant.color ? `• ${variant.color}` : ''} {variant.condition ? `• ${variant.condition}` : ''}</Typography>
            <Typography variant="body2"><strong>Plan:</strong> {plan.type} / {plan.weeks} weeks</Typography>
            <Typography variant="body2"><strong>Totals:</strong> {plan.currency || 'MWK'} {plan.totalAmount?.toLocaleString?.() || plan.totalAmount}</Typography>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Personal</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2"><strong>Name:</strong> {personal.fullName}</Typography>
            <Typography variant="body2"><strong>Email:</strong> {personal.email}</Typography>
            <Typography variant="body2"><strong>Phone:</strong> {personal.phone}</Typography>
            <Typography variant="body2"><strong>Address:</strong> {personal.address || '—'}</Typography>
            <Typography variant="body2"><strong>Town:</strong> {personal.town || '—'}</Typography>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Employment</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2"><strong>Status:</strong> {employment.status || employment.employmentStatus || '—'}</Typography>
            <Typography variant="body2"><strong>Employer:</strong> {employment.employerName || '—'}</Typography>
            <Typography variant="body2"><strong>Income:</strong> {employment.monthlyIncome || '—'}</Typography>
            <Typography variant="body2"><strong>Duration:</strong> {employment.duration || employment.employmentDuration || '—'}</Typography>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Status</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2"><strong>Reference:</strong> {application.reference}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {application.status}</Typography>
            <Typography variant="body2"><strong>Documents:</strong> {application.documents?.length || application.documentCount || 0}</Typography>
            <Typography variant="body2"><strong>Updated:</strong> {formatDate(application.updatedAt)}</Typography>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

const InstallmentApplications = () => {
  const { user, isAdmin } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [info, setInfo] = useState(null);

  const fetchApplications = async () => {
    const uid = user?.uid || user?.id;
    if (!uid && !isAdmin()) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = isAdmin()
        ? await installmentsAPI.getAdminApplications(statusFilter)
        : await installmentsAPI.getApplications(uid);
      if (res?.success) {
        const data = res.applications || res.data || res;
        setApplications(Array.isArray(data) ? data : []);
        if (res.unreadNotifications && isAdmin()) {
          setInfo(`${res.unreadNotifications} new admin notifications`);
        }
      } else {
        throw new Error(res?.error || 'Failed to load applications');
      }
    } catch (e) {
      setError(e.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleView = async (id) => {
    setActionLoading(true);
    try {
      const res = await installmentsAPI.getApplication(id);
      if (res?.success) {
        setDetail(res.application || res.data?.application || res.data || null);
        setDetailOpen(true);
      } else {
        setError(res?.error || 'Failed to load application');
      }
    } catch (e) {
      setError(e.message || 'Failed to load application');
    } finally {
      setActionLoading(false);
    }
  };

  const runAction = async (action, id, extra) => {
    setActionLoading(true);
    setError(null);
    try {
      if (action === 'approve') {
        await installmentsAPI.approveApplication(id, extra || 'Approved');
      } else if (action === 'deny') {
        await installmentsAPI.denyApplication(id, extra || 'Not approved');
      } else if (action === 'request') {
        const docs = (extra || '').split(',').map(s => s.trim()).filter(Boolean);
        await installmentsAPI.requestDocuments(id, docs);
      } else if (action === 'cancel') {
        await installmentsAPI.cancelApplication(id);
      }
      await fetchApplications();
    } catch (e) {
      setError(e.message || `Failed to ${action} application`);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(() => (
    [
      { key: 'reference', label: 'Reference', width: 130 },
      { key: 'customer', label: isAdmin() ? 'Customer' : 'Product', width: 180 },
      { key: 'plan', label: 'Plan', width: 120 },
      { key: 'amount', label: 'Totals', align: 'right', width: 120 },
      { key: 'status', label: 'Status', width: 140 },
      { key: 'createdAt', label: 'Submitted', width: 140 },
      { key: 'actions', label: 'Actions', align: 'right', width: 220 }
    ]
  ), [isAdmin]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700} color="white">Installment Applications</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {isAdmin() && (
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 150, bgcolor: 'white' }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="documents_requested">Docs Requested</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="cancelled">Cancelled</option>
            </TextField>
          )}
          <Tooltip title="Refresh">
            <IconButton onClick={fetchApplications} color="primary" disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflowX: 'auto' }}>
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map(col => (
                    <TableCell key={col.key} align={col.align || 'left'} sx={{ minWidth: col.width }}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>No applications yet.</TableCell>
                  </TableRow>
                )}
                {applications.map(app => (
                  <TableRow key={app.id} hover>
                    <TableCell>#{app.reference || app.id}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={600}>
                          {isAdmin() ? (app.fullName || 'Customer') : (app.gadgetName || app.gadget?.name || 'Gadget')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isAdmin() ? (app.email || '') : (app.variant?.storage ? `${app.variant.storage} • ${app.variant.color || ''}` : '')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.plan?.type || app.plan_type}</Typography>
                      <Typography variant="caption" color="text.secondary">{app.plan?.weeks || app.plan_weeks} weeks</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{app.plan?.currency || app.currency || 'MWK'} {(app.plan?.totalAmount ?? app.total_amount ?? app.plan?.total_amount ?? 0).toLocaleString()}</Typography>
                      <Typography variant="caption" color="text.secondary">Deposit {(app.plan?.depositAmount ?? app.deposit_amount ?? 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.status}
                        color={statusColor[app.status] || 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(app.createdAt || app.created_at)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="View details">
                          <span>
                            <IconButton size="small" onClick={() => handleView(app.id)} disabled={actionLoading}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {isAdmin() ? (
                          <>
                            <Tooltip title="Approve">
                              <span>
                                <IconButton size="small" disabled={actionLoading || app.status === 'approved'} onClick={() => runAction('approve', app.id)}>
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Deny">
                              <span>
                                <IconButton size="small" disabled={actionLoading || app.status === 'denied'} onClick={() => {
                                  const reason = window.prompt('Reason for denial?', 'Incomplete documents');
                                  if (reason !== null) runAction('deny', app.id, reason);
                                }}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Request documents">
                              <span>
                                <IconButton size="small" disabled={actionLoading} onClick={() => {
                                  const docs = window.prompt('List documents to request (comma-separated)', 'proof_of_income');
                                  if (docs !== null) runAction('request', app.id, docs);
                                }}>
                                  <UploadFileIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            {['pending', 'under_review', 'documents_requested'].includes(app.status) && (
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                disabled={actionLoading}
                                onClick={() => runAction('cancel', app.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon /> Application #{detail?.reference || detail?.id}
        </DialogTitle>
        <DialogContent dividers>
          {detail ? <ApplicationDetail application={detail} /> : <Typography>Loading…</Typography>}
          {detail?.documents?.length ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Documents</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {detail.documents.map((doc) => (
                  <Chip key={doc.id} label={`${doc.type} (${doc.verified ? 'verified' : 'pending'})`} size="small" />
                ))}
              </Stack>
            </Box>
          ) : null}
          {detail?.history?.length ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>History</Typography>
              <Stack spacing={0.5}>
                {detail.history.map((h, idx) => (
                  <Typography key={idx} variant="caption" color="text.secondary">
                    {formatDate(h.createdAt)} — {h.previousStatus || 'new'} ➜ {h.newStatus} ({h.changedBy}) {h.notes ? `– ${h.notes}` : ''}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstallmentApplications;