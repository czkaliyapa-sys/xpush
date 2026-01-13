import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Chip, CircularProgress, Alert, Button, LinearProgress, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Title from './Title';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usePricing } from '../hooks/usePricing';
import { ordersAPI, adminAPI, installmentsAPI, paymentsAPI } from '../services/api.js';
import { formatMWK } from '../utils/formatters';
import InstallmentPaymentModal from '../components/InstallmentPaymentModal.jsx';
import PrintableOrder from '../components/PrintableOrder.jsx';
import { useReactToPrint } from 'react-to-print';

// Safely parse JSON notes, supporting raw strings and nested objects
function parseNotes(notes) {
  if (!notes) return null;
  if (typeof notes === 'object') return notes;
  try {
    const obj = JSON.parse(notes);
    return obj;
  } catch {
    return null;
  }
}

function extractPlan(order) {
  const notesObj = parseNotes(order?.notes);
  const plan = notesObj?.installmentPlan || notesObj || null;
  const createdAt = order?.createdAt || order?.created_at;
  const paidAt = order?.paidAt || order?.paid_at;
  const totalAmount = Number(order?.totalAmount ?? order?.total_amount ?? 0);

  const depositAmount = Number(plan?.depositAmount ?? plan?.deposit ?? 0);
  const weeks = Number(plan?.weeks ?? plan?.durationWeeks ?? plan?.duration ?? 0);
  const weeklyAmount = Number(plan?.weeklyAmount ?? plan?.weekly ?? Math.ceil(Math.max(totalAmount - depositAmount, 0) / (weeks || 1)));
  const amountPaid = Number(plan?.amountPaid ?? (plan?.partials ? plan.partials.reduce((s, p) => s + Number(p?.amount || 0), 0) + depositAmount : depositAmount));
  const remainingAmount = Math.max((Number(plan?.totalAmount ?? totalAmount) - amountPaid), 0);
  const startDate = paidAt || createdAt;
  const expiryDate = startDate ? new Date(new Date(startDate).getTime() + (weeks * 7 * 24 * 60 * 60 * 1000)) : null;

  const status = remainingAmount <= 0 ? 'paid' : 'ongoing';

  // Compute next due date and indicator state based on plan
  let nextDueDate = null;
  let daysUntilDue = null;
  let dueState = 'unknown';
  let paymentsMade = 0;
  if (status !== 'paid' && startDate && weeks > 0) {
    // Estimate payments made from amountPaid minus deposit
    const netPaid = Math.max(0, amountPaid - depositAmount);
    const safeWeekly = weeklyAmount > 0 ? weeklyAmount : 1;
    paymentsMade = Math.min(weeks, Math.floor(netPaid / safeWeekly));
    const nextIndex = paymentsMade + 1;
    const start = new Date(startDate);
    nextDueDate = new Date(start.getTime() + nextIndex * 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    daysUntilDue = Math.ceil((nextDueDate - today) / (24 * 60 * 60 * 1000));
    if (daysUntilDue < 0) dueState = 'overdue';
    else if (daysUntilDue === 0) dueState = 'due_today';
    else if (daysUntilDue <= 3) dueState = 'due_soon';
    else dueState = 'upcoming';
  } else if (status === 'paid') {
    dueState = 'paid';
    daysUntilDue = 0;
  }

  return {
    raw: plan,
    weeks,
    weeklyAmount,
    depositAmount,
    amountPaid,
    remainingAmount,
    totalAmount: Number(plan?.totalAmount ?? totalAmount),
    startDate,
    expiryDate,
    status,
    nextDueDate,
    daysUntilDue,
    dueState,
    paymentsMade,
  };
}

export default function Installments() {
  const { user, isAdmin, userProfile } = useAuth();
  const { currency } = usePricing();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [serverInstallments, setServerInstallments] = useState({});
  const [printRow, setPrintRow] = useState(null);
  const printRef = useRef(null);
  const printNow = useReactToPrint({ content: () => printRef.current });

  useEffect(() => {
    const fetchInstallments = async () => {
      const uid = user?.uid || user?.id || null;
      const isAdminRole = isAdmin();
      const isPseudoAdminUid = uid === 'admin_system_default';
      const shouldUseAdminEndpoint = isAdminRole || isPseudoAdminUid;
      if (!shouldUseAdminEndpoint && !uid) return;
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = shouldUseAdminEndpoint ? await ordersAPI.getAllOrders() : await ordersAPI.getUserOrders(uid);
        if (res?.success) {
          const list = (res.orders || []).filter((o) => {
            const notesObj = parseNotes(o?.notes);
            return !!(notesObj?.installmentPlan || notesObj?.paymentType === 'installment_deposit' || notesObj?.paymentType === 'installment_payment');
          });
          setOrders(list);
          // Fetch authoritative server schedule per order (non-blocking)
          try {
            const acc = {};
            for (const o of list) {
              const r = await installmentsAPI.getPlanByOrder(o.id);
              if (r?.success && r?.data?.plan) {
                acc[o.id] = r.data;
              }
            }
            setServerInstallments(acc);
          } catch (_) {
            // Ignore failures; UI falls back to client-calculated schedule
          }
        } else {
          throw new Error(res?.error || 'Failed to fetch installments');
        }
      } catch (e) {
        const status = e?.response?.status;
        const endpointPath = shouldUseAdminEndpoint ? '/admin/orders' : (uid ? `/orders/user/${uid}` : '/orders/user/:uid');
        console.error('Installments fetch error:', { error: e, status, endpointPath });
        if (isAdminRole && status === 404 && uid && !isPseudoAdminUid) {
          try {
            const userRes = await ordersAPI.getUserOrders(uid);
            if (userRes?.success) {
              const list = (userRes.orders || []).filter((o) => {
                const notesObj = parseNotes(o?.notes);
                return !!(notesObj?.installmentPlan || notesObj?.paymentType === 'installment_deposit' || notesObj?.paymentType === 'installment_payment');
              });
              setOrders(list);
              setNotice('Admin endpoint unavailable; showing your installments only.');
              setError(null);
            } else {
              setError(userRes?.error || `Orders API endpoint not found (404) for ${endpointPath}.`);
            }
          } catch (fallbackErr) {
            console.error('Fallback installments fetch error:', fallbackErr);
            setError(`Orders API endpoint not found (404) for ${endpointPath}.`);
          }
        } else {
          let message;
          if (status === 404) message = `Orders API endpoint not found (404) for ${endpointPath}.`;
          else if (status === 401 || status === 403) message = `Access denied (${status}). Please ensure you are logged in with the correct permissions.`;
          else if (status >= 500) message = `Server error (${status}). Please try again later.`;
          else if (!status && e?.message?.includes('Network')) message = 'Network error while contacting the API.';
          else message = e?.message || 'Failed to fetch installments';
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInstallments();
  }, [user, isAdmin]);

  const rows = useMemo(() => orders.map((order) => {
    const plan = extractPlan(order);
    const server = serverInstallments[order.id];
    const sp = server?.plan;
    if (sp) {
      plan.startDate = sp.start_at || plan.startDate;
      plan.expiryDate = sp.expiry_at || plan.expiryDate;
      plan.nextDueDate = sp.next_due_at || plan.nextDueDate;
      plan.weeks = Number(sp.weeks ?? plan.weeks);
      plan.weeklyAmount = Number(sp.weekly_amount ?? plan.weeklyAmount);
      plan.depositAmount = Number(sp.deposit_amount ?? plan.depositAmount);
      plan.amountPaid = Number(sp.amount_paid ?? plan.amountPaid);
      plan.totalAmount = Number(sp.total_amount ?? plan.totalAmount);
      plan.status = sp.status || plan.status;
      plan.paymentsMade = Number(sp.payments_made ?? plan.paymentsMade);
      plan.remainingAmount = Math.max(plan.totalAmount - plan.amountPaid, 0);
      if (plan.status !== 'paid' && plan.nextDueDate) {
        const today = new Date();
        const nextDue = new Date(plan.nextDueDate);
        const days = Math.ceil((nextDue - today) / (24 * 60 * 60 * 1000));
        plan.daysUntilDue = days;
        if (days < 0) plan.dueState = 'overdue';
        else if (days === 0) plan.dueState = 'due_today';
        else if (days <= 3) plan.dueState = 'due_soon';
        else plan.dueState = 'upcoming';
      }
    }
    return {
      id: order.id,
      userEmail: order.userEmail,
      userName: order.userName,
      createdAt: order.createdAt,
      startDate: plan.startDate,
      expiryDate: plan.expiryDate,
      weeks: plan.weeks,
      weeklyAmount: plan.weeklyAmount,
      depositAmount: plan.depositAmount,
      amountPaid: plan.amountPaid,
      remainingAmount: plan.remainingAmount,
      totalAmount: plan.totalAmount,
      status: plan.status,
      nextDueDate: plan.nextDueDate,
      daysUntilDue: plan.daysUntilDue,
      dueState: plan.dueState,
      order,
    };
  }), [orders, serverInstallments]);

  const openPay = (row) => {
    setSelectedOrder(row.order);
    setPayModalOpen(true);
  };

  const closePay = () => {
    setSelectedOrder(null);
    setPayModalOpen(false);
  };

  const handlePayRemaining = async (row) => {
    if (row.status === 'paid') return;
    try {
      // Require valid Malawi phone number
      const malawiPhoneRegex = /^\+265\d{9}$/;
      const phoneVal = (userProfile?.phone || '').trim();
      if (!malawiPhoneRegex.test(phoneVal)) {
        setError('Please add an active phone number (+265 followed by 9 digits) in Profile Settings before making an installment payment.');
        try { navigate('/dashboard/settings'); } catch (_) {}
        return;
      }

      const remaining = Math.round(Number(row.remainingAmount || 0));
      if (!remaining || remaining <= 0) {
        setNotice('No remaining balance to pay.');
        return;
      }

      const items = [
        {
          id: `order:${row.id}`,
          name: 'Final Installment Payment',
          price: remaining,
          quantity: 1
        }
      ];

      const installmentPlan = {
        enabled: true,
        paymentType: 'installment_payment',
        orderId: row.id,
        weeks: Number(row.weeks || 0),
        weeklyAmount: Math.round(Number(row.weeklyAmount || 0)),
        remainingAmount: remaining,
        totalAmount: Math.round(Number(row.totalAmount || 0)),
        payAmount: remaining,
        payMode: 'remaining'
      };

      const options = {
        customerEmail: user?.email || null,
        successUrl: 'https://itsxtrapush.com/payment/success',
        cancelUrl: 'https://itsxtrapush.com/payment/cancel',
        installmentPlan,
        currency: currency
      };

      const res = await paymentsAPI.createCheckoutSession(items, options);
      if (res?.success && res?.url) {
        try {
          localStorage.setItem('xp_lastCheckout', JSON.stringify({ items, installmentPlan, customerEmail: user?.email || null }));
        } catch (_) {}
        window.location.href = res.url;
      } else if (res?.url) {
        try {
          localStorage.setItem('xp_lastCheckout', JSON.stringify({ items, installmentPlan, customerEmail: user?.email || null }));
        } catch (_) {}
        window.location.href = res.url;
      } else {
        setError(res?.error || 'Failed to create checkout session');
      }
    } catch (e) {
      console.error('Pay remaining checkout failed:', e);
      const data = e?.response?.data;
      setError(data?.details || data?.error || e?.message || 'Unexpected error');
    }
  };

  const handlePayCustom = (row) => {
    setSelectedOrder(row.order);
    setPayModalOpen(true);
    // Modal will be opened with custom mode via initialPayMode prop
  };

  const cancelInstallment = async (row) => {
    if (!isAdmin()) return;
    const reason = window.prompt('Enter cancellation reason (optional):', 'Missed payments / revoked by admin');
    if (reason === null) { return; }
    try {
      setIsCancelling(true);
      const adminUid = user?.uid || user?.id || 'admin_system_default';
      const res = await adminAPI.cancelInstallment({ orderId: row.id, adminUid, reason });
      if (res?.success) {
        setNotice('Installment cancelled and stock restored.');
        // Optimistically update UI
        setOrders(prev => prev.map(o => o.id === row.id ? { ...o, status: 'cancelled' } : o));
      } else {
        setError(res?.error || 'Failed to cancel installment');
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) setError('Admin privileges required to cancel installments.');
      else setError(e?.message || 'Failed to cancel installment');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = (row) => {
    setPrintRow(row);
    setTimeout(() => {
      try { printNow(); } catch (_) {}
    }, 50);
  };

  return (
    <React.Fragment>
      <Title>{isAdmin() ? 'All Installments' : 'My Installments'}</Title>
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
              <TableCell>Start</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Periods</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Remaining</TableCell>
              <TableCell>Next Due</TableCell>
              <TableCell>Indicator</TableCell>
              <TableCell align="right">Progress</TableCell>
              <TableCell align="right">Time Left</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin() ? 11 : 10} align="center">No installments yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>#{row.id}</TableCell>
                  {isAdmin() && (
                    <TableCell>
                      <Typography variant="body2">{row.userEmail || '—'}</Typography>
                      {row.userName && (
                        <Typography variant="caption" color="text.secondary">{row.userName}</Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{row.startDate ? new Date(row.startDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{row.weeks || '—'} weeks</TableCell>
                  <TableCell align="right">{formatMWK(row.amountPaid || 0)}</TableCell>
                  <TableCell align="right">{formatMWK(row.remainingAmount || 0)}</TableCell>
                  <TableCell>{row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    {row.status === 'paid' ? (
                      <Chip label="Completed" color="success" size="small" />
                    ) : row.dueState === 'overdue' ? (
                      <Chip label={`Overdue by ${Math.abs(row.daysUntilDue || 0)}d`} color="error" size="small" />
                    ) : row.dueState === 'due_today' ? (
                      <Chip label="Due today" color="warning" size="small" />
                    ) : (
                      <Chip label={`Due in ${row.daysUntilDue ?? '—'}d`} color={row.dueState === 'due_soon' ? 'info' : 'primary'} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 160 }}>
                    {(() => {
                      const total = Number(row.totalAmount || 0);
                      const paid = Number(row.amountPaid || 0);
                      const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((paid / total) * 100))) : 0;
                      const made = Number(row.paymentsMade || 0);
                      const of = Number(row.weeks || 0);
                      return (
                        <Tooltip title={`Payments: ${made} of ${of} | ${percent}% paid`} arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 999 }} />
                            </Box>
                            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{percent}%</Typography>
                          </Box>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell align="right">
                    {(() => {
                      if (row.status === 'paid') return '—';
                      const today = new Date();
                      const exp = row.expiryDate ? new Date(row.expiryDate) : null;
                      if (!exp || isNaN(exp.getTime())) return '—';
                      const daysLeft = Math.ceil((exp - today) / (24 * 60 * 60 * 1000));
                      return daysLeft >= 0 ? `${daysLeft}d` : 'Expired';
                    })()}
                  </TableCell>
                  <TableCell>
                    {row.status === 'paid' ? (
                      <Chip label="Completed" color="success" size="small" />
                    ) : row.status === 'cancelled' ? (
                      <Chip label="Cancelled" color="error" size="small" />
                    ) : (
                      <Chip label={row.status || 'ongoing'} color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button variant="contained" size="small" disabled={row.status === 'paid'} onClick={() => openPay(row)}>
                        Pay weekly
                      </Button>
                      <Button variant="contained" color="success" size="small" disabled={row.status === 'paid' || (Number(row.remainingAmount || 0) <= 0)} onClick={() => handlePayRemaining(row)}>
                        Pay remaining
                      </Button>
                      <Button variant="outlined" size="small" disabled={row.status === 'paid'} onClick={() => handlePayCustom(row)}>
                        Pay custom
                      </Button>
                      {isAdmin() && (
                        <>
                          <Button variant="outlined" color="error" size="small" disabled={isCancelling || row.status === 'paid'} onClick={() => cancelInstallment(row)}>
                            {isCancelling ? 'Cancelling…' : 'Cancel'}
                          </Button>
                          <Button variant="outlined" color="primary" size="small" sx={{ ml: 1 }} onClick={() => handlePrint(row)}>
                            Print
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Payment Modal for custom installment payment */}
      <InstallmentPaymentModal
        open={payModalOpen}
        onClose={closePay}
        order={selectedOrder}
        customerEmail={user?.email}
        initialPayMode={'custom'}
      />

      {/* Hidden printable component */}
      <Box sx={{ display: 'none' }}>
        {printRow && (
          <PrintableOrder ref={printRef} order={printRow.order} plan={{
            weeks: printRow.weeks,
            weeklyAmount: printRow.weeklyAmount,
            totalAmount: printRow.totalAmount,
            amountPaid: printRow.amountPaid,
            remainingAmount: printRow.remainingAmount,
            nextDueDate: printRow.nextDueDate,
          }} />
        )}
      </Box>
    </React.Fragment>
  );
}
