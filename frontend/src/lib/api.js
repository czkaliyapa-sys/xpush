import axios from 'axios';

// PHP Backend URL - change this to your production URL
const PHP_BACKEND_URL = 'https://itsxtrapush.com';

// Create axios instance for PHP backend
export const phpApi = axios.create({
  baseURL: PHP_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// API endpoints
export const api = {
  // Gadgets
  getGadgets: (params = {}) => phpApi.get('/gadgets', { params }),
  getGadget: (id) => phpApi.get(`/gadgets/${id}`),
  getCategories: () => phpApi.get('/gadgets/categories'),
  getBrands: () => phpApi.get('/gadgets/brands'),
  
  // Reviews
  getReviews: (gadgetId) => phpApi.get(`/gadgets/${gadgetId}/reviews`),
  createReview: (gadgetId, data) => phpApi.post(`/gadgets/${gadgetId}/reviews`, data),
  
  // Cart & Checkout
  createCheckout: (data) => phpApi.post('/payments/checkout', data),
  verifyPayment: (txRef) => phpApi.get(`/payments/verify/${txRef}`),
  
  // Orders
  getOrders: (userUid) => phpApi.get(`/orders/user/${userUid}`),
  getOrder: (id) => phpApi.get(`/orders/${id}`),
  
  // Subscriptions
  getSubscriptionPlans: () => phpApi.get('/subscriptions/plans'),
  createSubscription: (data) => phpApi.post('/subscriptions/create', data),
  cancelSubscription: (userUid) => phpApi.post('/subscriptions/cancel', { userUid }),
  
  // Trade-in
  getTradeInEstimate: (data) => phpApi.post('/trade-in/estimate', data),
  submitTradeIn: (data) => phpApi.post('/trade-in/submit', data),
  
  // Analytics (Admin)
  getAnalytics: () => phpApi.get('/analytics/cached'),
  
  // User
  syncUser: (data) => phpApi.post('/users/sync', data),
  getUserProfile: (uid) => phpApi.get(`/users/${uid}`),
  
  // Health check
  health: () => phpApi.get('/health'),
};

export default api;
