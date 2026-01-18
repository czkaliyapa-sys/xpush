import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Chip, CircularProgress, Alert, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Title from './Title';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ordersAPI } from '../services/api.js';
import { usePricing } from '../hooks/usePricing';
import PrintableOrder from '../components/PrintableOrder.jsx';
import { exportNodeToPdf, renderNodeToPdfUrl } from '../utils/pdf.js';

export default function Orders() {
  const { user, isAdmin } = useAuth();
  const { currency: userCurrency, isInMalawi } = usePricing();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const orderPrintRef = useRef(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);

  const normalizeCurrency = (code) => {
    const c = (code || '').toUpperCase();
    if (c === 'GBP' || c === 'MWK') return c;
    return isInMalawi ? 'MWK' : 'GBP';
  };

  const normalizeAmount = (amount, currencyCode) => {
    const curr = normalizeCurrency(currencyCode);
    const num = Number(amount);
    if (!Number.isFinite(num)) return 0;
    if (curr === 'GBP') {
      // Heuristic: backend may send minor units (pence). If very large, assume pence and scale.
      if (Math.abs(num) >= 20000) return num / 100;
      return num;
    }
    return num;
  };

  const formatAmount = (amount, currencyCode) => {
    const curr = normalizeCurrency(currencyCode);
    const value = normalizeAmount(amount, curr);
    const formatter = new Intl.NumberFormat(curr === 'GBP' ? 'en-GB' : 'en-MW', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: curr === 'MWK' ? 0 : 2,
    });
    return formatter.format(value);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      // For admin, fetch all orders. For regular users, fetch their orders.
      const uid = user?.uid || user?.id || null;
      const isAdminRole = isAdmin();
      const isPseudoAdminUid = uid === 'admin_system_default';
      const shouldUseAdminEndpoint = isAdminRole || isPseudoAdminUid;
      if (!shouldUseAdminEndpoint && !uid) return;
      setLoading(true);
      setError(null);
      try {
        const res = shouldUseAdminEndpoint ? await ordersAPI.getAllOrders() : await ordersAPI.getUserOrders(uid);
        if (res?.success) {
          setOrders(res.orders || []);
        } else {
          throw new Error(res?.error || 'Failed to fetch orders');
        }
      } catch (e) {
        const status = e?.response?.status;
        const endpointPath = shouldUseAdminEndpoint ? '/admin/orders' : (uid ? `/orders/user/${uid}` : '/orders/user/:uid');
        console.error('Orders fetch error:', { error: e, status, endpointPath });
        // Fallback: if admin endpoint is missing, try fetching own orders
        if (isAdminRole && status === 404 && uid && !isPseudoAdminUid) {
          try {
            const userRes = await ordersAPI.getUserOrders(uid);
            if (userRes?.success) {
              setOrders(userRes.orders || []);
              setNotice('Admin endpoint unavailable; showing your orders only.');
              setError(null);
            } else {
              setError(userRes?.error || `Orders API endpoint not found (404) for ${endpointPath}.`);
            }
          } catch (fallbackErr) {
            console.error('Fallback user orders fetch error:', fallbackErr);
            setError(`Orders API endpoint not found (404) for ${endpointPath}.`);
          }
        } else {
          let message;
          if (status === 404) {
            message = `Orders API endpoint not found (404) for ${endpointPath}.`;
          } else if (status === 401 || status === 403) {
            message = `Access denied (${status}). Please ensure you are logged in with the correct permissions.`;
          } else if (status >= 500) {
            message = `Server error (${status}). Please try again later.`;
          } else if (!status && e?.message?.includes('Network')) {
            message = 'Network error while contacting the API.';
          } else {
            message = e?.message || 'Failed to fetch orders';
          }
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, isAdmin]);

  return (
    <React.Fragment>
      <Title>{isAdmin() ? 'All Orders' : 'My Orders'}</Title>
      <Paper sx={{ p: 2 }}>
        {notice && (
          <Alert severity="warning" sx={{ mb: 2 }}>{notice}</Alert>
        )}
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
                <TableCell>Order ID</TableCell>
                {isAdmin() && <TableCell>User</TableCell>}
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin() ? 8 : 7} align="center">No orders yet.</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    {isAdmin() && (
                      <TableCell>
                        <Typography variant="body2">{order.userEmail || '—'}</Typography>
                        {order.userName && (
                          <Typography variant="caption" color="text.secondary">{order.userName}</Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status === 'pre_order' ? 'PRE-ORDER' : (order.status || 'pending')} 
                        size="small"
                        sx={{
                          bgcolor: order.status === 'pre_order' ? '#f59e0b' : undefined,
                          color: order.status === 'pre_order' ? 'white' : undefined,
                          fontWeight: order.status === 'pre_order' ? 700 : undefined
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={order.paymentStatus || 'unpaid'} color={order.paymentStatus === 'paid' ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      {Array.isArray(order.items) && order.items.map((it, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                          <img src={it.image} alt={it.name} style={{ width: 32, height: 32, borderRadius: 4 }} />
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2">{it.name} x{it.quantity} ({it.brand} {it.model})</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {it.storage ? `Storage: ${it.storage}` : 'Storage: —'}
                                {typeof it.variantId !== 'undefined' && it.variantId !== null ? ` • Variant #${it.variantId}` : ''}
                                {typeof it.unitPrice !== 'undefined' ? ` • Unit: ${formatAmount(it.unitPrice, it.currency || order.currency || userCurrency)}` : ''}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </TableCell>
                      <TableCell align="right">{formatAmount(order.totalAmount ?? order.total_amount, order.currency || userCurrency)}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          setSelectedOrder(order);
                          // next tick to ensure PrintableOrder updates
                          setTimeout(async () => {
                            if (orderPrintRef.current) {
                              await exportNodeToPdf(orderPrintRef.current, `Order-${order.id}.pdf`);
                            }
                          }, 0);
                        }}
                      >
                        Download PDF
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={async () => {
                          setSelectedOrder(order);
                          setTimeout(async () => {
                            if (orderPrintRef.current) {
                              const url = await renderNodeToPdfUrl(orderPrintRef.current);
                              setViewerUrl(url);
                              setViewerOpen(true);
                            }
                          }, 0);
                        }}
                      >
                        View PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </TableContainer>
        )}
        {/* Hidden printable component for selected order */}
        <Box sx={{ position: 'absolute', left: -9999, top: -9999 }}>
          {selectedOrder && (
            <PrintableOrder ref={orderPrintRef} order={selectedOrder} />
          )}
        </Box>
      </Paper>
      <Dialog open={viewerOpen} onClose={() => { setViewerOpen(false); if (viewerUrl) { try { URL.revokeObjectURL(viewerUrl); } catch {} setViewerUrl(null); } }} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Order PDF Preview
          <IconButton aria-label="close" onClick={() => { setViewerOpen(false); if (viewerUrl) { try { URL.revokeObjectURL(viewerUrl); } catch {} setViewerUrl(null); } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewerUrl ? (
            <iframe title="Order PDF" src={viewerUrl} style={{ width: '100%', height: '80vh', border: 'none' }} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}