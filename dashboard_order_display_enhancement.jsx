import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableHead, TableRow, TableContainer, Chip, CircularProgress, 
  Alert, Button, LinearProgress, Tooltip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, Card, CardContent 
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ordersAPI } from '../services/api.js';
import { formatCurrency } from '../utils/currencyUtils';
import InstallmentPaymentModal from '../components/InstallmentPaymentModal.jsx';
import PrintableOrder from '../components/PrintableOrder.jsx';
import { useReactToPrint } from 'react-to-print';

/**
 * Enhanced Order Display Component
 * Ensures accurate gadget information, installment details, and complete order data
 * in dashboard views
 */

const EnhancedOrderDisplay = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [currency, setCurrency] = useState('MWK');

  // Print functionality
  const componentRef = React.useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Order_${selectedOrder?.id}_Receipt`,
  });

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const loadOrders = async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await ordersAPI.getByUserId(currentUser.uid);
      if (response?.success) {
        // Sort by most recent first
        const sortedOrders = response.orders.sort((a, b) => 
          new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
        );
        setOrders(sortedOrders);
      } else {
        setError(response?.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const getOrderItemsWithDetails = (order) => {
    // Parse order items from notes or dedicated items array
    let items = [];
    
    if (Array.isArray(order.items)) {
      items = order.items;
    } else if (order.cart) {
      items = Array.isArray(order.cart) ? order.cart : [];
    } else if (order.notes) {
      try {
        const notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
        if (Array.isArray(notes?.items)) {
          items = notes.items;
        } else if (Array.isArray(notes?.cart)) {
          items = notes.cart;
        }
      } catch (e) {
        console.warn('Could not parse order items from notes');
      }
    }
    
    return items.map(item => ({
      id: item.id || item.gadget_id,
      name: item.name || item.title || 'Unknown Item',
      brand: item.brand || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || item.price || 0,
      totalPrice: item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 1),
      image: item.image || item.imageUrl || '',
      storage: item.storage || '',
      color: item.color || '',
      condition: item.condition || '',
      category: item.category || ''
    }));
  };

  const getInstallmentPlan = (order) => {
    if (!order.notes) return null;
    
    try {
      const notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
      const plan = notes?.installmentPlan || notes;
      
      if (plan && (plan.weeks || plan.totalAmount)) {
        return {
          weeks: plan.weeks || 0,
          weeklyAmount: plan.weeklyAmount || 0,
          depositAmount: plan.depositAmount || plan.deposit || 0,
          totalAmount: plan.totalAmount || order.totalAmount || 0,
          amountPaid: plan.amountPaid || (plan.partials ? 
            plan.partials.reduce((sum, p) => sum + (p.amount || 0), 0) + (plan.depositAmount || 0) : 
            plan.depositAmount || 0),
          remainingAmount: Math.max((plan.totalAmount || order.totalAmount || 0) - 
            (plan.amountPaid || (plan.partials ? 
              plan.partials.reduce((sum, p) => sum + (p.amount || 0), 0) + (plan.depositAmount || 0) : 
              plan.depositAmount || 0)), 0),
          status: plan.remainingAmount <= 0 ? 'paid' : 'ongoing'
        };
      }
    } catch (e) {
      console.warn('Could not parse installment plan');
    }
    
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDetailDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDetailDialog(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Order History
      </Typography>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your order history will appear here once you make purchases
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => {
                const items = getOrderItemsWithDetails(order);
                const installmentPlan = getInstallmentPlan(order);
                const orderCurrency = order.currency || 'MWK';
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        #{order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(order.createdAt || order.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {items.slice(0, 2).map((item, index) => (
                          <Typography key={index} variant="body2" sx={{ display: 'block' }}>
                            {item.quantity}× {item.name}
                            {item.storage && ` (${item.storage})`}
                          </Typography>
                        ))}
                        {items.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{items.length - 2} more items
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(
                          orderCurrency === 'GBP' ? order.totalAmountGbp || order.total_amount_gbp || order.totalAmount || 0 : 
                          order.totalAmount || order.total_amount || 0,
                          orderCurrency
                        )}
                      </Typography>
                      {installmentPlan && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Deposit: {formatCurrency(installmentPlan.depositAmount, orderCurrency)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.provider?.toUpperCase() || 'UNKNOWN'}
                        size="small"
                        color={order.provider === 'square' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status?.toUpperCase() || 'UNKNOWN'}
                        size="small"
                        color={order.status === 'paid' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        onClick={() => handleViewDetails(order)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Order Detail Dialog */}
      <Dialog 
        open={openDetailDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details - #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Order Summary */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Order Date</Typography>
                      <Typography variant="body2">
                        {formatDate(selectedOrder.createdAt || selectedOrder.created_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Payment Date</Typography>
                      <Typography variant="body2">
                        {formatDate(selectedOrder.paidAt || selectedOrder.paid_at) || 'Not recorded'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Payment Method</Typography>
                      <Chip 
                        label={selectedOrder.provider?.toUpperCase() || 'UNKNOWN'}
                        size="small"
                        color={selectedOrder.provider === 'square' ? 'primary' : 'secondary'}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Status</Typography>
                      <Chip 
                        label={selectedOrder.status?.toUpperCase() || 'UNKNOWN'}
                        size="small"
                        color={selectedOrder.status === 'paid' ? 'success' : 'warning'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Total Amount</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(
                          (selectedOrder.currency || 'MWK') === 'GBP' ? 
                          selectedOrder.totalAmountGbp || selectedOrder.total_amount_gbp || selectedOrder.totalAmount || 0 :
                          selectedOrder.totalAmount || selectedOrder.total_amount || 0,
                          selectedOrder.currency || 'MWK'
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Items */}
              <Typography variant="h6" sx={{ mb: 2 }}>Items Purchased</Typography>
              {getOrderItemsWithDetails(selectedOrder).map((item, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      {item.image && (
                        <Grid item xs={12} sm={3}>
                          <img 
                            src={item.image} 
                            alt={item.name}
                            style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={item.image ? 9 : 12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {item.name}
                        </Typography>
                        {item.brand && (
                          <Typography variant="body2" color="text.secondary">
                            Brand: {item.brand}
                          </Typography>
                        )}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Quantity:</strong> {item.quantity}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Unit Price:</strong> {formatCurrency(item.unitPrice, selectedOrder.currency || 'MWK')}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Total:</strong> {formatCurrency(item.totalPrice, selectedOrder.currency || 'MWK')}
                            </Typography>
                          </Grid>
                          {(item.storage || item.color || item.condition) && (
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                {item.storage && `Storage: ${item.storage}`}
                                {item.color && ` • Color: ${item.color}`}
                                {item.condition && ` • Condition: ${item.condition}`}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              {/* Installment Plan */}
              {getInstallmentPlan(selectedOrder) && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Installment Plan</Typography>
                  <Card>
                    <CardContent>
                      {(() => {
                        const plan = getInstallmentPlan(selectedOrder);
                        return (
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Plan Duration:</strong> {plan.weeks} weeks
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Deposit:</strong> {formatCurrency(plan.depositAmount, selectedOrder.currency || 'MWK')}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Weekly Payment:</strong> {formatCurrency(plan.weeklyAmount, selectedOrder.currency || 'MWK')}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Total Amount:</strong> {formatCurrency(plan.totalAmount, selectedOrder.currency || 'MWK')}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Amount Paid:</strong> {formatCurrency(plan.amountPaid, selectedOrder.currency || 'MWK')}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Remaining:</strong> {formatCurrency(plan.remainingAmount, selectedOrder.currency || 'MWK')}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(plan.amountPaid / plan.totalAmount) * 100} 
                                sx={{ mt: 1 }}
                              />
                              <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                                {Math.round((plan.amountPaid / plan.totalAmount) * 100)}% Complete
                              </Typography>
                            </Grid>
                          </Grid>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Hidden printable component */}
              <div style={{ display: 'none' }}>
                <PrintableOrder 
                  ref={componentRef}
                  order={selectedOrder}
                  plan={getInstallmentPlan(selectedOrder)}
                />
              </div>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrint} variant="outlined">
            Print Receipt
          </Button>
          <Button onClick={handleCloseDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedOrderDisplay;