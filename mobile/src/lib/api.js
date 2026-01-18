import axios from 'axios';

// PHP Backend URL
const API_BASE_URL = 'https://itsxtrapush.com';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // Gadgets
  getGadgets: (params = {}) => apiClient.get('/gadgets', { params }),
  getGadget: (id) => apiClient.get(`/gadgets/${id}`),
  getCategories: () => apiClient.get('/gadgets/categories'),
  getBrands: () => apiClient.get('/gadgets/brands'),
  searchGadgets: (query) => apiClient.get('/gadgets', { params: { q: query } }),

  // Reviews
  getReviews: (gadgetId) => apiClient.get(`/gadgets/${gadgetId}/reviews`),
  createReview: (gadgetId, data) => apiClient.post(`/gadgets/${gadgetId}/reviews`, data),

  // Cart & Checkout
  createCheckout: (data) => apiClient.post('/payments/checkout', data),
  verifyPayment: (txRef) => apiClient.get(`/payments/verify/${txRef}`),

  // Orders
  getOrders: (userUid) => apiClient.get(`/orders/user/${userUid}`),
  getOrder: (id) => apiClient.get(`/orders/${id}`),

  // Subscriptions
  getSubscriptionPlans: () => apiClient.get('/subscriptions/plans'),
  createSubscription: (data) => apiClient.post('/subscriptions/create', data),

  // Trade-in
  getTradeInEstimate: (data) => apiClient.post('/trade-in/estimate', data),
  submitTradeIn: (data) => apiClient.post('/trade-in/submit', data),

  // User
  syncUser: (data) => apiClient.post('/users/sync', data),
  getUserProfile: (uid) => apiClient.get(`/users/${uid}`),

  // Health
  health: () => apiClient.get('/health'),
};

export default api;
