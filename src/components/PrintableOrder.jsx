import React, { forwardRef } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import Logo from './Logo.jsx';

// PrintableOrder
// Renders a print-friendly summary of an order and its installment plan.
// Use with react-to-print via a ref.
const PrintableOrder = forwardRef(({ order, plan }, ref) => {
  const items = Array.isArray(order?.items) ? order.items : (Array.isArray(order?.cart) ? order.cart : []);

  const currency = (order?.currency || 'MWK').toUpperCase();
  const paidAmount = Number(plan?.amountPaid ?? order?.totalAmount ?? 0);
  const paidAtStr = order?.paidAt || order?.paid_at || order?.createdAt || order?.created_at || null;
  const paidAt = paidAtStr ? new Date(paidAtStr) : new Date();

  const formatAmount = (amount) => {
    const divisor = currency === 'MWK' ? 1 : 100;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((amount || 0) / divisor);
  };

  const resolveImageUrl = (url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      const host = (parsed.hostname || '').replace(/^www\./, '');
      if (host === 'sparkle-pro.co.uk') {
        // Route through dev proxy to avoid CORS during pdf rendering.
        // Ensure we do not duplicate the /api prefix.
        let path = parsed.pathname || '/';
        if (!/^\/api\//i.test(path)) {
          path = `/api${path.startsWith('/') ? '' : '/'}${path}`;
        }
        return `${path}${parsed.search || ''}`;
      }
      return url;
    } catch (_) {
      return url;
    }
  };

  const tableStyles = {
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
    th: { textAlign: 'left', border: '1px solid #ddd', padding: '8px', background: '#f7f7f7' },
    td: { border: '1px solid #ddd', padding: '8px' },
    right: { border: '1px solid #ddd', padding: '8px', textAlign: 'right' }
  };

  const brandHeader = (
    <Box sx={{ background: '#fff', color: '#000', p: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #eee' }}>
      <Logo style={{ width: 120, height: 'auto', transform: 'none' }} />
    </Box>
  );

  return (
    <Box ref={ref} sx={{ p: 0, m: 0, background: '#fff', color: '#000' }}>
      {brandHeader}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Order #{order?.id ?? '—'}</Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Summary</Typography>
        <table style={tableStyles.table}>
          <tbody>
            <tr>
              <td style={tableStyles.td}>Email</td>
              <td style={tableStyles.right}>{order?.userEmail || order?.email || order?.customer?.email || order?.user?.email || '—'}</td>
            </tr>
            <tr>
              <td style={tableStyles.td}>Paid at</td>
              <td style={tableStyles.right}>{paidAt.toLocaleString()}</td>
            </tr>
            <tr>
              <td style={tableStyles.td}>Amount paid</td>
              <td style={tableStyles.right}>{formatAmount(paidAmount)}</td>
            </tr>
          </tbody>
        </table>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Items</Typography>
        {items && items.length > 0 ? (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th style={tableStyles.th}>Image</th>
                <th style={tableStyles.th}>Item</th>
                <th style={tableStyles.th}>Details</th>
                <th style={tableStyles.th}>Qty</th>
                <th style={tableStyles.th}>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={tableStyles.td}>
                    {it?.image ? (
                      <img src={resolveImageUrl(it.image)} crossOrigin="anonymous" referrerPolicy="no-referrer" alt={it.name || it.title || 'Item'} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={tableStyles.td}>
                    <strong>{it?.name || it?.title || it?.id || 'Item'}</strong>
                  </td>
                  <td style={tableStyles.td}>
                    {[it?.brand, it?.model, it?.storage, it?.condition].filter(Boolean).join(' • ') || '—'}
                  </td>
                  <td style={tableStyles.right}>{Number(it?.quantity || 1)}</td>
                  <td style={tableStyles.right}>{typeof it?.price === 'number' ? formatAmount(Number(it.price)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Typography variant="body2" color="text.secondary">No items</Typography>
        )}
        {plan && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Installment Plan</Typography>
            <table style={tableStyles.table}>
              <tbody>
                <tr>
                  <td style={tableStyles.td}>Weeks</td>
                  <td style={tableStyles.right}>{plan.weeks ?? '—'}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Weekly Amount</td>
                  <td style={tableStyles.right}>{typeof plan.weeklyAmount === 'number' ? formatAmount(Number(plan.weeklyAmount)) : '—'}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Total</td>
                  <td style={tableStyles.right}>{typeof plan.totalAmount === 'number' ? formatAmount(Number(plan.totalAmount)) : '—'}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Amount Paid</td>
                  <td style={tableStyles.right}>{typeof plan.amountPaid === 'number' ? formatAmount(Number(plan.amountPaid)) : '—'}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Remaining</td>
                  <td style={tableStyles.right}>{typeof plan.remainingAmount === 'number' ? formatAmount(Number(plan.remainingAmount)) : '—'}</td>
                </tr>
                <tr>
                  <td style={tableStyles.td}>Next Due</td>
                  <td style={tableStyles.right}>{plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString() : '—'}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </Box>
    </Box>
  );
});

export default PrintableOrder;