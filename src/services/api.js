import axios from 'axios';

// API service for backend communication
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? '/api' : 'https://sparkle-pro.co.uk/api');
const IMAGES_BASE_URL = process.env.REACT_APP_IMAGES_BASE_URL || (process.env.NODE_ENV === 'development' ? '/api/images' : 'https://sparkle-pro.co.uk/api/images');

// Debug: Log API configuration on module load
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    API_BASE_URL,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    NODE_ENV: process.env.NODE_ENV
  });
}

// Configure axios defaults (don't set credentials globally)
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Create axios instance for public API calls (no credentials needed)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // Changed to false for public APIs
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Create separate axios instance for authenticated API calls
const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Only use credentials when needed
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Normalize image URLs to a consistent base and correct filenames
const normalizeImageUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') {
      return `${IMAGES_BASE_URL}/placeholder.png`;
    }
    let cleaned = url.trim();
    // Force https
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
    // Normalize domain to non-www
    cleaned = cleaned.replace('www.sparkle-pro.co.uk', 'sparkle-pro.co.uk');

    // Allow data URLs (for inline previews)
    if (/^data:image\//i.test(cleaned)) {
      return cleaned;
    }

    // Extract filename if present
    const parts = cleaned.split('/');
    let filename = parts[parts.length - 1] || cleaned;

    // Handle spaces and common typos
    filename = filename.replace(/\s+/g, '');
    const fixes = {
      's24ul.png': 's24ultra.png',
      's25ul.png': 's25ultra.png',
      'tuf1.png': 'asustuf1.png',
      'iphone16max.png': 'iphone16max.png',
      'iphone16.png': 'iphone16.png',
      'iphone16pro.png': 'iphone16.png',
      'iphone16proMax.png': 'iphone16max.png',
      'iphone16proMax.jpg': 'iphone16max.png',
      'iphone16.jpg': 'iphone16.png',
      'galaxy14.png': 'galaxy14.png',
      'macbookm4.png': 'macbookm4.png',
      'asustuf1.png': 'asustuf1.png',
      'hpomen.png': 'hpomen.png',
      'asusrog.png': 'asusrog.png',
      'vivox80.png': 'vivox80.png',
      'redmi12.png': 'redmi12.png'
    };

    // If the incoming URL already points to our images base, preserve subpaths
    if (cleaned.includes('/api/images/')) {
      const subPath = cleaned.split('/api/images/')[1] || filename;
      const subParts = subPath.split('/');
      const last = subParts[subParts.length - 1] || filename;
      const fixedLast = fixes[last] || last;
      subParts[subParts.length - 1] = fixedLast;
      return `${IMAGES_BASE_URL}/${subParts.join('/')}`;
    }

    // If it's a full URL but not our base, still map to our base with filename
    if (/^https?:\/\//.test(cleaned)) {
      const fixed = fixes[filename] || filename;
      return `${IMAGES_BASE_URL}/${fixed}`;
    }

    // Otherwise treat as a raw filename and prefix
    const fixed = fixes[filename] || filename;
    return `${IMAGES_BASE_URL}/${fixed}`;
  } catch (e) {
    return `${IMAGES_BASE_URL}/placeholder.png`;
  }
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  try {
    const config = {
      url: endpoint,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
      headers: {
        ...options.headers
      },
      ...options
    };

    // Use authenticated client only when explicitly required
    const client = options.requireAuth ? authApiClient : apiClient;
    
    // Debug: Log API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 API Call:', {
        endpoint,
        baseURL: client.defaults.baseURL,
        fullURL: `${client.defaults.baseURL}${endpoint}`,
        method: config.method
      });
    }
    
    const response = await client(config);
    return response.data;
  } catch (error) {
    // Enhance error logging to surface backend response details
    const status = error?.response?.status;
    const statusText = error?.response?.statusText;
    const data = error?.response?.data;
    const method = options?.method || 'GET';
    
    // Extract the actual error message from backend if available
    const backendError = data?.error || data?.message || null;
    
    console.error('API call failed:', {
      endpoint,
      method,
      status,
      statusText,
      backendData: data,
      backendError: backendError,
      message: error?.message,
    });
    
    // Alert user with backend error if available (for critical errors like 400)
    if (status === 400 && backendError) {
      console.error('❌ Backend validation error:', backendError);
      alert(`Request failed: ${backendError}`);
    }

    // Fallback for environments where REST paths are not rewritten correctly (single index.php backend)
    // If a call returns 404 on /api/*, retry via /index.php?endpoint=/path&query for ANY method
    const alreadyRetried = options?._retriedFallback === true;
    const client = options.requireAuth ? authApiClient : apiClient;
    const baseURL = client.defaults?.baseURL || '';
    const isApiBase = typeof baseURL === 'string' && baseURL.includes('/api');
    const shouldFallback = !alreadyRetried && status === 404 && isApiBase;

    if (shouldFallback) {
      try {
        const [pathPart, qsPart] = String(endpoint).split('?');
        const fallbackEndpoint = `/index.php?endpoint=${encodeURIComponent(pathPart)}${qsPart ? `&${qsPart}` : ''}`;

        if (process.env.NODE_ENV === 'development') {
          console.warn('🔁 Retrying via index.php fallback:', {
            original: endpoint,
            fallback: fallbackEndpoint,
            baseURL,
            method
          });
        }

        const fallbackConfig = {
          url: fallbackEndpoint,
          method: method || 'GET',
          data: options.body ? JSON.parse(options.body) : undefined,
          headers: {
            ...options.headers
          },
          _retriedFallback: true
        };
        const fallbackResponse = await client(fallbackConfig);
        return fallbackResponse.data;
      } catch (fallbackErr) {
        // Log and rethrow original error if fallback also fails
        console.error('Fallback API call failed:', {
          endpoint,
          method,
          status: fallbackErr?.response?.status,
          message: fallbackErr?.message
        });
      }
    }

    throw error;
  }
};

// Authentication API functions
export const authAPI = {
  // Register user
  register: async (userData) => {
    return await apiCall('/auth/register', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(userData)
    });
  },

  // Login user
  login: async (credentials) => {
    return await apiCall('/auth/login', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(credentials)
    });
  },

  // Get user profile
  getUserProfile: async (uid) => {
    return await apiCall(`/user/profile/${uid}`);
  },

  // Update user profile
  updateUserProfile: async (uid, userData) => {
    return await apiCall(`/user/profile/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // Request password reset (backend-managed)
  requestPasswordReset: async (email) => {
    return await apiCall('/auth/password/reset-request', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Confirm password reset with token
  confirmPasswordReset: async ({ email, token, newPassword }) => {
    return await apiCall('/auth/password/reset-confirm', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword })
    });
  }
  ,
  // Verify OTP without resetting password
  verifyOtp: async ({ email, token }) => {
    return await apiCall('/auth/password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, token })
    });
  },
  // Link a Google account to an existing email/password account
  linkGoogle: async ({ email, googleUid, displayName }) => {
    return await apiCall('/auth/link-google', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ email, googleUid, displayName })
    });
  }
};

// Gadgets API functions
export const gadgetsAPI = {
  // Map camelCase frontend fields to snake_case backend fields (gadget payload)
  // Map camelCase frontend fields to snake_case backend fields
  _toBackendPayload: (data = {}) => {
    const stockQuantity = data.stockQuantity ?? data.stock_quantity ?? data.stock;
    const monthlyPrice = data.monthlyPrice ?? data.monthly_price;
    const monthlyPriceGbp = data.monthlyPriceGbp ?? data.monthly_price_gbp;
    const priceGbp = data.priceGbp ?? data.price_gbp;
    const inStock = (typeof data.inStock !== 'undefined') ? (data.inStock ? 1 : 0) : undefined;
    const condition = data.condition ?? data.conditionStatus ?? data.condition_status;
    return {
      ...data,
      image_url: data.image_url ?? data.image ?? undefined,
      monthly_price: typeof monthlyPrice !== 'undefined' ? Number(monthlyPrice) : undefined,
      monthly_price_gbp: typeof monthlyPriceGbp !== 'undefined' ? Number(monthlyPriceGbp) : undefined,
      price_gbp: typeof priceGbp !== 'undefined' ? Number(priceGbp) : undefined,
      stock_quantity: typeof stockQuantity !== 'undefined' ? parseInt(stockQuantity, 10) : undefined,
      in_stock: typeof inStock !== 'undefined' ? inStock : (typeof stockQuantity !== 'undefined' ? (parseInt(stockQuantity, 10) > 0 ? 1 : 0) : undefined),
      condition_status: condition
    };
  },
  // Normalize variant payload for backend - supports Color/Storage/Condition pricing
  _toVariantPayload: (data = {}) => {
    const stockQuantity = data.stockQuantity ?? data.stock_quantity;
    const condition = data.condition ?? data.condition_status;
    const color = data.color ?? null;
    const colorHex = data.colorHex ?? data.color_hex ?? null;
    const priceGbp = data.priceGbp ?? data.price_gbp;
    return {
      color: color || null,
      colorHex: colorHex || null,
      storage: data.storage,
      condition: condition,
      price: typeof data.price !== 'undefined' ? Number(data.price) : undefined,
      priceGbp: typeof priceGbp !== 'undefined' ? Number(priceGbp) : undefined,
      stockQuantity: typeof stockQuantity !== 'undefined' ? parseInt(stockQuantity, 10) : undefined,
      sku: typeof data.sku !== 'undefined' ? data.sku : undefined,
      isActive: typeof data.isActive !== 'undefined' ? (data.isActive ? 1 : 0) : undefined
    };
  },
  // Get all gadgets - using direct JSON file as fallback
  getAll: async (filters = {}) => {
    try {
      // Try the main API endpoint first
      const queryParams = new URLSearchParams();
      
      if (filters.category) {
        queryParams.append('category', filters.category);
      }
      
      if (filters.brand) {
        queryParams.append('brand', filters.brand);
      }
      
      if (filters.minPrice !== undefined) {
        queryParams.append('minPrice', filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined) {
        queryParams.append('maxPrice', filters.maxPrice);
      }
      
      if (filters.inStock !== undefined) {
        const inStockParam = typeof filters.inStock === 'boolean' ? (filters.inStock ? '1' : '0') : String(filters.inStock);
        queryParams.append('inStock', inStockParam);
      }
      
      // Handle condition filter
      if (filters.condition && Array.isArray(filters.condition) && filters.condition.length > 0) {
        queryParams.append('condition', filters.condition.join(','));
      }
      
      // Pass currency for proper price filtering
      if (filters.currency) {
        queryParams.append('currency', filters.currency);
      }
      
      // Pagination: default to 50 so all items are visible
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 50;
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      const endpoint = `/gadgets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const payload = await apiCall(endpoint);
      if (payload && payload.success && Array.isArray(payload.data)) {
        payload.data = payload.data.map(item => {
          const stockQtyRaw = (item.stock_quantity ?? item.stock ?? item.stockQuantity ?? undefined);
          const qtyNum = Number(stockQtyRaw);
          const flag = (item.effective_in_stock ?? item.in_stock ?? item.inStock ?? undefined);
          const flagSanitized = (() => {
            if (typeof flag === 'undefined') return false;
            const s = String(flag).trim().toLowerCase();
            if (s === '1' || s === 'true') return true;
            if (s === '0' || s === 'false' || s === '' || s === 'null' || s === 'undefined') return false;
            const n = Number(flag);
            if (Number.isFinite(n)) return n > 0;
            return !!flag;
          })();
          const available = flagSanitized || (Number.isFinite(qtyNum) ? qtyNum > 0 : false);
          const normalizedQty = Number.isFinite(qtyNum) ? qtyNum : (available ? 1 : 0);
          return {
            ...item,
            image: normalizeImageUrl(item.image || item.image_url),
            monthlyPrice: item.monthly_price ?? item.monthlyPrice ?? 0,
            stockQuantity: normalizedQty,
            inStock: available,
            condition: item.condition ?? item.condition_status ?? undefined,
            price_gbp: item.price_gbp ?? item.priceGbp ?? undefined,
            priceGbp: item.price_gbp ?? item.priceGbp ?? undefined,
            monthly_price_gbp: item.monthly_price_gbp ?? item.monthlyPriceGbp ?? undefined,
            monthlyPriceGbp: item.monthly_price_gbp ?? item.monthlyPriceGbp ?? undefined
          };
        });
      }
      return payload;
    } catch (error) {
      console.log('🔄 Main API failed, trying direct JSON file...');
      // Fallback to direct JSON file
      const response = await apiClient.get('/gadgets.json');
      let data = response.data;
      
      // Apply filters locally if any
      if (filters.category) {
        const normalize = (val) => {
          if (!val) return val;
          const map = {
            smartphones: 'smartphone',
            phones: 'smartphone',
            laptops: 'laptop',
            notebooks: 'laptop',
            tablets: 'tablet',
            accessory: 'accessories',
            accessories: 'accessories',
            gaming: 'gaming',
            audio: 'audio',
            wearable: 'wearable',
            wearables: 'wearable',
            productivity: 'productivity',
            desktop: 'desktop'
          };
          const key = String(val).toLowerCase().trim();
          return map[key] ?? key;
        };
        const filterSlug = normalize(filters.category);
        data = data.filter(item => normalize(item.category) === filterSlug);
      }
      if (filters.brand) {
        data = data.filter(item => item.brand === filters.brand);
      }
      if (filters.minPrice !== undefined) {
        data = data.filter(item => Number(item.price) >= Number(filters.minPrice));
      }
      if (filters.maxPrice !== undefined) {
        data = data.filter(item => Number(item.price) <= Number(filters.maxPrice));
      }
      if (filters.inStock !== undefined) {
        const wantInStock = filters.inStock === true || filters.inStock === 1 || filters.inStock === '1';
        data = data.filter(item => {
          const qty = (item.stock_quantity ?? item.stockQuantity ?? item.stock ?? item.number ?? 0);
          const qtyNum = Number(qty);
          const flag = (item.in_stock ?? item.inStock ?? false);
          const flagSanitized = (() => {
            const s = String(flag).trim().toLowerCase();
            if (s === '1' || s === 'true') return true;
            if (s === '0' || s === 'false' || s === '' || s === 'null' || s === 'undefined') return false;
            const n = Number(flag);
            if (Number.isFinite(n)) return n > 0;
            return !!flag;
          })();
          const available = Number.isFinite(qtyNum) ? qtyNum > 0 : flagSanitized;
          return wantInStock ? available : !available;
        });
      }
      
      // Handle condition filter in fallback
      if (filters.condition && Array.isArray(filters.condition) && filters.condition.length > 0) {
        data = data.filter(item => {
          const cond = item.condition ?? item.condition_status ?? item.conditionStatus;
          return cond && filters.condition.includes(cond);
        });
      }
      
      // Normalize image URLs and stock fields in fallback too
      const normalized = Array.isArray(data) ? data.map(item => {
        const stockQtyRaw = (item.stock ?? item.stock_quantity ?? item.stockQuantity ?? item.number ?? undefined);
        const qtyNum = Number(stockQtyRaw);
        const flag = (item.in_stock ?? item.inStock ?? undefined);
        const flagSanitized = (() => {
          if (typeof flag === 'undefined') return false;
          const s = String(flag).trim().toLowerCase();
          if (s === '1' || s === 'true') return true;
          if (s === '0' || s === 'false' || s === '' || s === 'null' || s === 'undefined') return false;
          const n = Number(flag);
          if (Number.isFinite(n)) return n > 0;
          return !!flag;
        })();
        const available = Number.isFinite(qtyNum) ? qtyNum > 0 : flagSanitized;
        const normalizedQty = Number.isFinite(qtyNum) ? qtyNum : (available ? 1 : 0);
        return {
          ...item,
          image: normalizeImageUrl(item.image || item.image_url),
          monthlyPrice: item.monthly_price ?? item.monthlyPrice ?? 0,
          price_gbp: item.price_gbp ?? item.priceGbp ?? undefined,
          priceGbp: item.price_gbp ?? item.priceGbp ?? undefined,
          monthly_price_gbp: item.monthly_price_gbp ?? item.monthlyPriceGbp ?? undefined,
          monthlyPriceGbp: item.monthly_price_gbp ?? item.monthlyPriceGbp ?? undefined,
          stockQuantity: normalizedQty,
          inStock: available,
          condition: item.condition ?? item.condition_status ?? undefined
        };
      }) : data;
      return { success: true, data: normalized, count: Array.isArray(normalized) ? normalized.length : 0 };
    }
  },

  // Upload one or more images for gadgets
  uploadImages: async (files) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((f) => f && formData.append('images', f));
    } else if (files) {
      formData.append('images', files);
    }
    const response = await apiClient.post('/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Admin: create a new gadget
  adminCreate: async (adminUid, gadgetData) => {
    return await apiCall('/admin/gadgets', {
      method: 'POST',
      body: JSON.stringify({
        adminUid,
        ...gadgetsAPI._toBackendPayload(gadgetData)
      })
    });
  },

  // Admin: update an existing gadget
  adminUpdate: async (id, adminUid, gadgetData) => {
    return await apiCall(`/admin/gadgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        adminUid,
        ...gadgetsAPI._toBackendPayload(gadgetData)
      })
    });
  },

  // Admin: delete (soft-delete) a gadget
  adminDelete: async (id, adminUid) => {
    return await apiCall(`/admin/gadgets/${id}`, {
      method: 'DELETE',
      // Backend accepts adminUid either in body or query; send in body
      body: JSON.stringify({ adminUid })
    });
  },

  // Admin: get variants for a gadget
  adminGetVariants: async (gadgetId, adminUid, options = {}) => {
    const params = new URLSearchParams();
    if (adminUid) params.append('adminUid', adminUid);
    if (options.includeInactive) params.append('includeInactive', 'true');
    const qs = params.toString();
    const endpoint = qs ? `/admin/gadgets/${gadgetId}/variants?${qs}` : `/admin/gadgets/${gadgetId}/variants`;
    const res = await apiCall(endpoint);
    // Normalize variant keys for frontend consistency
    if (res?.success && Array.isArray(res.data)) {
      res.data = res.data.map(v => ({
        ...v,
        condition_status: v.condition ?? v.condition_status,
        stock_quantity: typeof v.stock_quantity !== 'undefined' ? v.stock_quantity : v.stockQuantity,
        is_active: typeof v.is_active !== 'undefined' ? v.is_active : v.isActive
      }));
    }
    return res;
  },

  // Admin: create a variant for a gadget
  adminCreateVariant: async (gadgetId, adminUid, variantData) => {
    return await apiCall(`/admin/gadgets/${gadgetId}/variants`, {
      method: 'POST',
      body: JSON.stringify({
        adminUid,
        ...gadgetsAPI._toVariantPayload(variantData)
      })
    });
  },

  // Admin: update a variant for a gadget
  adminUpdateVariant: async (gadgetId, variantId, adminUid, variantData) => {
    return await apiCall(`/admin/gadgets/${gadgetId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify({
        adminUid,
        ...gadgetsAPI._toVariantPayload(variantData)
      })
    });
  },

  // Admin: delete (soft-delete) a variant
  adminDeleteVariant: async (gadgetId, variantId, adminUid) => {
    return await apiCall(`/admin/gadgets/${gadgetId}/variants/${variantId}`, {
      method: 'DELETE',
      body: JSON.stringify({ adminUid })
    });
  },

  // Get gadget by ID
  getById: async (id) => {
    try {
      const result = await apiCall(`/gadgets/${id}`);
      if (result && result.success && result.data) {
        result.data.image = normalizeImageUrl(result.data.image || result.data.image_url);
        if (Array.isArray(result.data.more_img)) {
          result.data.more_img = result.data.more_img.map(normalizeImageUrl);
        }
        // Normalize condition field in detail response
        result.data.condition = result.data.condition ?? result.data.condition_status ?? result.data.conditionStatus ?? undefined;
        
        // Explicitly preserve and normalize GBP price fields for dual-currency support
        result.data.priceGbp = result.data.price_gbp ?? result.data.priceGbp ?? undefined;
        result.data.monthlyPriceGbp = result.data.monthly_price_gbp ?? result.data.monthlyPriceGbp ?? undefined;

        // Normalize stock fields to align with list/getAll shape
        const stockQtyRaw = (result.data.stock_quantity ?? result.data.stock ?? result.data.stockQuantity ?? undefined);
        const qtyNum = Number(stockQtyRaw);
        const flag = (result.data.effective_in_stock ?? result.data.in_stock ?? result.data.inStock ?? undefined);
        const flagSanitized = (() => {
          if (typeof flag === 'undefined') return false;
          const s = String(flag).trim().toLowerCase();
          if (s === '1' || s === 'true') return true;
          if (s === '0' || s === 'false' || s === '' || s === 'null' || s === 'undefined') return false;
          const n = Number(flag);
          if (Number.isFinite(n)) return n > 0;
          return !!flag;
        })();
        // Consider variants stock when available
        const variants = Array.isArray(result.data.variants) ? result.data.variants : [];
        const variantStockTotal = variants
          .map(v => ({
            isActive: typeof v.is_active !== 'undefined' ? v.is_active : v.active,
            stock: typeof v.stock_quantity !== 'undefined' ? v.stock_quantity : v.stockQuantity
          }))
          .filter(v => (v.isActive ?? 1) === 1)
          .reduce((sum, v) => sum + (parseInt(v.stock ?? 0, 10) || 0), 0);

        const available = flagSanitized || (Number.isFinite(qtyNum) ? qtyNum > 0 : false) || (variantStockTotal > 0);
        const normalizedQty = Number.isFinite(qtyNum) ? qtyNum : (variantStockTotal > 0 ? variantStockTotal : (available ? 1 : 0));
        result.data.stockQuantity = normalizedQty;
        result.data.inStock = available;
      }
      return result;
    } catch (error) {
      console.log('🔄 Main API failed, searching in JSON file...');
      // Fallback: get all gadgets and find by ID
      const allGadgets = await gadgetsAPI.getAll();
      const gadget = allGadgets.data.find(g => g.id === parseInt(id));
      if (gadget) {
        return { success: true, data: gadget };
      }
      throw new Error('Gadget not found');
    }
  },

  // Get gadgets by category
  getByCategory: async (category) => {
    try {
      return await apiCall(`/gadgets?category=${encodeURIComponent(category)}`);
    } catch (error) {
      console.log('🔄 Main API failed, filtering JSON file by category...');
      // Fallback: use getAll with category filter
      const result = await gadgetsAPI.getAll({ category });
      return { success: true, data: result.data };
    }
  },

  // Get available categories
  getCategories: async () => {
    try {
      const res = await apiCall('/gadgets/categories');
      // Normalize API payload to { name, slug, count }
      if (res && res.success && Array.isArray(res.data)) {
        const normalize = (val) => {
          if (!val) return '';
          const map = {
            smartphones: 'smartphone',
            phones: 'smartphone',
            laptops: 'laptop',
            notebooks: 'laptop',
            tablets: 'tablet',
            accessory: 'accessories',
            accessories: 'accessories',
            gaming: 'gaming',
            audio: 'audio',
            wearable: 'wearable',
            wearables: 'wearable',
            productivity: 'productivity',
            desktop: 'desktop'
          };
          const key = String(val).toLowerCase().trim();
          return map[key] ?? key;
        };
        const mapped = res.data.map((item) => {
          const raw = item.category ?? item.name ?? item.slug ?? '';
          const slug = normalize(raw);
          const display = slug === 'wearable'
            ? 'Wearables'
            : slug === 'accessories'
              ? 'Accessories'
              : slug === 'desktop'
                ? 'Desktops'
                : (raw ? (raw.charAt(0).toUpperCase() + String(raw).slice(1)) : (slug.charAt(0).toUpperCase() + slug.slice(1)));
          return {
            name: display,
            slug,
            count: Number(item.count ?? 0)
          };
        });
        return { success: true, data: mapped };
      }
      return res;
    } catch (error) {
      console.log('🔄 Main API failed, extracting categories from JSON file...');
      // Fallback: get all gadgets and extract unique categories
      const allGadgets = await gadgetsAPI.getAll();
      const normalize = (val) => {
        if (!val) return val;
        const map = {
          smartphones: 'smartphone',
          phones: 'smartphone',
          laptops: 'laptop',
          notebooks: 'laptop',
          tablets: 'tablet',
          accessory: 'accessories',
          accessories: 'accessories',
          gaming: 'gaming',
          audio: 'audio',
          wearable: 'wearable',
          wearables: 'wearable',
          productivity: 'productivity',
          desktop: 'desktop'
        };
        const key = String(val).toLowerCase().trim();
        return map[key] ?? key;
      };
      const allowed = ['smartphone','laptop','tablet','accessories','gaming','audio','wearable','productivity','desktop'];
      const counts = {};
      for (const g of allGadgets.data) {
        const slug = normalize(g.category);
        counts[slug] = (counts[slug] || 0) + 1;
      }
      const categories = allowed.map(slug => ({
        name: slug === 'wearable' ? 'Wearables' : slug === 'accessories' ? 'Accessories' : slug === 'desktop' ? 'Desktops' : slug.charAt(0).toUpperCase() + slug.slice(1),
        slug,
        count: counts[slug] || 0
      }));
      return { success: true, data: categories };
    }
  },

  // Get available brands
  getBrands: async () => {
    try {
      const res = await apiCall('/gadgets/brands');
      // Normalize API payload to { name, count }
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((item) => {
          if (typeof item === 'string') {
            return { name: item, count: 0 };
          }
          return {
            name: item.name ?? item.brand ?? '',
            count: Number(item.count ?? 0)
          };
        });
        return { success: true, data: mapped };
      }
      return res;
    } catch (error) {
      console.log('🔄 Main API failed, extracting brands from JSON file...');
      // Fallback: get all gadgets and extract unique brands
      const allGadgets = await gadgetsAPI.getAll();
      const counts = {};
      for (const g of allGadgets.data) {
        const name = g.brand ?? '';
        if (!name) continue;
        counts[name] = (counts[name] || 0) + 1;
      }
      const brands = Object.keys(counts).sort().map((name) => ({ name, count: counts[name] }));
      return { success: true, data: brands };
    }
  },

  // Search gadgets
  search: async (query) => {
    try {
      const payload = await apiCall(`/gadgets?q=${encodeURIComponent(query)}`);
      // Normalize to match getAll shape so admin dashboard selection preloads correctly
      if (payload && payload.success && Array.isArray(payload.data)) {
        payload.data = payload.data.map(item => {
          const stockQtyRaw = (item.stock_quantity ?? item.stock ?? item.stockQuantity ?? undefined);
          const qtyNum = Number(stockQtyRaw);
          const flag = (item.effective_in_stock ?? item.in_stock ?? item.inStock ?? undefined);
          const flagSanitized = (() => {
            if (typeof flag === 'undefined') return false;
            const s = String(flag).trim().toLowerCase();
            if (s === '1' || s === 'true') return true;
            if (s === '0' || s === 'false' || s === '' || s === 'null' || s === 'undefined') return false;
            const n = Number(flag);
            if (Number.isFinite(n)) return n > 0;
            return !!flag;
          })();
          const available = flagSanitized || (Number.isFinite(qtyNum) ? qtyNum > 0 : false);
          const normalizedQty = Number.isFinite(qtyNum) ? qtyNum : (available ? 1 : 0);
          return {
            ...item,
            image: normalizeImageUrl(item.image || item.image_url),
            monthlyPrice: item.monthly_price ?? item.monthlyPrice ?? 0,
            stockQuantity: normalizedQty,
            inStock: available,
            condition: item.condition ?? item.condition_status ?? undefined
          };
        });
      }
      return payload;
    } catch (error) {
      console.log('🔄 Main API failed, searching in JSON file...');
      // Fallback: get all gadgets and filter locally
      const allGadgets = await gadgetsAPI.getAll();
      const filtered = allGadgets.data.filter(gadget => 
        gadget.name.toLowerCase().includes(query.toLowerCase()) ||
        gadget.description.toLowerCase().includes(query.toLowerCase()) ||
        gadget.category.toLowerCase().includes(query.toLowerCase())
      );
      return { success: true, data: filtered };
    }
  },

  // Reviews: get reviews for a gadget
  getReviews: async (gadgetId) => {
    return await apiCall(`/gadgets/${gadgetId}/reviews`);
  },

  // Reviews: create a review (comment and optional rating)
  createReview: async (gadgetId, { userUid, comment, rating }) => {
    return await apiCall(`/gadgets/${gadgetId}/reviews`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ userUid, comment, rating })
    });
  },

  // Reviews: reply to a review
  replyToReview: async (reviewId, { userUid, comment }) => {
    return await apiCall(`/reviews/${reviewId}/reply`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ userUid, comment })
    });
  },

  // Reviews: react to a review (like/dislike/emoji)
  reactToReview: async (reviewId, { userUid, reaction }) => {
    return await apiCall(`/reviews/${reviewId}/react`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ userUid, reaction })
    });
  }
};

// Payments API functions
export const paymentsAPI = {
  // Create PayChangu checkout session (for Malawi - MWK)
  createCheckoutSession: async (items, options = {}) => {
    return await apiCall('/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        items,
        customerEmail: options.customerEmail,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
        installmentPlan: options.installmentPlan,
        currency: options.currency || 'MWK',
        gateway: 'paychangu'
      })
    });
  },

  // Create Square checkout session (for International - GBP)
  createSquareCheckout: async (params) => {
    return await apiCall('/payments/square/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        items: params.items,
        customerEmail: params.customerEmail,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        installmentPlan: params.installmentPlan,
        currency: params.currency || 'GBP',
        gateway: 'square',
        // Subscription opt-in (Plus or Premium)
        includeSubscription: params.includeSubscription || false,
        subscriptionTier: params.subscriptionTier || null, // 'plus' or 'premium'
        userUid: params.userUid || null
      })
    });
  },

  // Get session details
  getSession: async (sessionId) => {
    return await apiCall(`/payments/session/${sessionId}`);
  },

  // Verify PayChangu transaction by tx_ref
  verifyPayChangu: async (txRef) => {
    return await apiCall(`/payments/paychangu/verify/${txRef}`);
  },

  // Verify Square payment by order ID or tx_ref
  verifySquarePayment: async (reference) => {
    return await apiCall(`/payments/square/verify/${reference}`);
  },

  // Get Square config
  getSquareConfig: async () => {
    return await apiCall('/payments/square/config');
  },

  // Get general payment config (legacy)
  getConfig: async () => {
    return await apiCall('/payments/config');
  },

  // Notify backend to send confirmation emails after successful payment
  notifyPaymentSuccess: async (payload) => {
    return await apiCall('/payments/notify-success', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

// Subscriptions API functions
export const subscriptionsAPI = {
  // Get subscription status for a user
  getStatus: async (userUid) => {
    return await apiCall(`/subscriptions/status?uid=${userUid}`);
  },

  // Create a new subscription
  create: async (params) => {
    // Log what we're about to send
    const payload = {
      userUid: params.userUid,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl || window.location.origin + '/dashboard?subscription=success',
      currency: params.currency || 'GBP',
      tier: params.tier || 'plus',
      gateway: params.gateway || 'square' // 'square' or 'paychangu'
    };
    
    console.log('📤 Sending subscription creation request:', payload);
    
    return await apiCall('/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Cancel subscription
  cancel: async (userUid) => {
    return await apiCall('/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ userUid })
    });
  },

  // Create PayChangu renewal checkout
  renewWithPaychangu: async (params) => {
    return await apiCall('/subscriptions/renew-paychangu', {
      method: 'POST',
      body: JSON.stringify({
        userUid: params.userUid,
        tier: params.tier
      })
    });
  },

  // Device Linking
  linkDevice: async (userUid, deviceId, linkedBy = 'MANUAL') => {
    return await apiCall('/subscriptions/link-device', {
      method: 'POST',
      body: JSON.stringify({
        userUid,
        deviceId,
        linkedBy
      })
    });
  },

  // Get linked device
  getLinkedDevice: async (userUid) => {
    return await apiCall(`/subscriptions/linked-device?userUid=${userUid}`);
  },

  // Get recent devices for linking
  getRecentDevices: async (userUid, limit = 5) => {
    return await apiCall(`/subscriptions/recent-devices?userUid=${userUid}&limit=${limit}`);
  },

  // Unlink device
  unlinkDevice: async (userUid) => {
    return await apiCall('/subscriptions/unlink-device', {
      method: 'POST',
      body: JSON.stringify({ userUid })
    });
  }
};

// Analytics API functions
export const analyticsAPI = {
  // Get cached dashboard analytics with time range filtering
  getDashboardStats: async (timeRange = '30d') => {
    return await apiCall(`/analytics/dashboard?timeRange=${timeRange}`);
  }
};

// Orders API functions
export const ordersAPI = {
  // Get orders for a user by uid
  getUserOrders: async (uid) => {
    return await apiCall(`/orders/user/${uid}`);
  },
  // Get all orders (admin)
  getAllOrders: async () => {
    return await apiCall('/admin/orders');
  }
};

// Admin API functions
export const adminAPI = {
  // Cancel installment and restock items
  cancelInstallment: async ({ orderId, adminUid, reason }) => {
    return await apiCall('/admin/installments/cancel', {
      method: 'POST',
      body: JSON.stringify({ orderId, adminUid, reason })
    });
  }
};

// Installments API
export const installmentsAPI = {
  // Fetch server-provided plan and registries by orderId
  getPlanByOrder: async (orderId) => {
    const params = new URLSearchParams({ orderId: String(orderId) });
    return await apiCall(`/installments/plan?${params.toString()}`);
  },

  // Start a payment for an installment (next due or custom amount)
  pay: async ({ orderId, amount, currency, customerEmail, gateway, installmentPlan }) => {
    return await apiCall('/installments/pay', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, currency, customerEmail, gateway, installmentPlan })
    });
  },

  // Generate or fetch a receipt PDF/link for an order/installment
  generateReceipt: async (orderId) => {
    return await apiCall(`/installments/${orderId}/receipt`);
  },

  // Schedule an email reminder a set number of days before due date (default: 1 day prior)
  scheduleReminder: async ({ orderId, daysBefore = 1 }) => {
    return await apiCall('/installments/reminder', {
      method: 'POST',
      body: JSON.stringify({ orderId, daysBefore })
    });
  },

  // List receipts for a user (to surface in dashboard history)
  listReceipts: async (userUid) => {
    return await apiCall(`/installments/receipts?uid=${encodeURIComponent(userUid)}`);
  },

  // ============ Installment Applications API ============
  
  // Submit a new installment application with documents
  submitApplication: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/installments/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });
      return response.data;
    } catch (error) {
      console.error('Application submission error:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit application');
    }
  },

  // Get user's installment applications
  getApplications: async (userUid) => {
    return await apiCall(`/installments/applications?uid=${encodeURIComponent(userUid)}`);
  },

  // Get single application details
  getApplication: async (applicationId) => {
    return await apiCall(`/installments/applications/${applicationId}`);
  },

  // Cancel an application (user can cancel pending applications)
  cancelApplication: async (applicationId) => {
    return await apiCall(`/installments/applications/${applicationId}/cancel`, {
      method: 'POST'
    });
  },

  // Admin: Get all pending applications
  getAdminApplications: async (status = 'all') => {
    return await apiCall(`/admin/installments/applications?status=${status}`, {
      requireAuth: true
    });
  },

  // Admin: Approve an application
  approveApplication: async (applicationId, adminNotes = '') => {
    return await apiCall(`/admin/installments/applications/${applicationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes }),
      requireAuth: true
    });
  },

  // Admin: Deny an application
  denyApplication: async (applicationId, reason = '') => {
    return await apiCall(`/admin/installments/applications/${applicationId}/deny`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      requireAuth: true
    });
  },

  // Admin: Request additional documents
  requestDocuments: async (applicationId, documentsNeeded = []) => {
    return await apiCall(`/admin/installments/applications/${applicationId}/request-docs`, {
      method: 'POST',
      body: JSON.stringify({ documentsNeeded }),
      requireAuth: true
    });
  }
};

// Bookings API functions
export const bookingsAPI = {
  // Forward booking details to admin via backend email
  create: async (booking) => {
    return await apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking)
    });
  }
};

// Appointments API - Full appointment scheduling system
export const appointmentsAPI = {
  // Create a new appointment
  create: async (appointment) => {
    return await apiCall('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment)
    });
  },

  // Get available time slots for a date and location
  getAvailableSlots: async (date, locationId) => {
    const params = new URLSearchParams({
      date,
      locationId
    });
    return await apiCall(`/appointments/available-slots?${params}`);
  },

  // Check if user has an active appointment
  getUserActive: async (userId) => {
    return await apiCall(`/appointments/user-active?userId=${userId}`);
  },

  // Get all appointments for a user
  getUserAppointments: async (userId) => {
    return await apiCall(`/appointments/user?userId=${userId}`);
  },

  // Cancel an appointment
  cancel: async (appointmentId, userId, reason = 'User requested') => {
    return await apiCall('/appointments/cancel', {
      method: 'POST',
      body: JSON.stringify({ appointmentId, userId, reason })
    });
  }
};

// Users API functions (admin)
export const usersAPI = {
  // Get all users (admin) with optional filters
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (typeof filters.active !== 'undefined') params.append('active', filters.active ? '1' : '0');
    // Backend expects `sellerVerified` (1/0), not `verifiedSeller` ('true'/'false')
    if (typeof filters.verifiedSeller !== 'undefined') params.append('sellerVerified', filters.verifiedSeller ? '1' : '0');
    if (filters.adminUid) params.append('adminUid', filters.adminUid);
    const qs = params.toString();
    const endpoint = qs ? `/admin/users?${qs}` : '/admin/users';
    return await apiCall(endpoint);
  },

  // Get user detail by uid (admin)
  getUserDetail: async (uid, adminUid = null) => {
    const endpoint = adminUid ? `/admin/users/${uid}?adminUid=${encodeURIComponent(adminUid)}` : `/admin/users/${uid}`;
    return await apiCall(endpoint);
  },

  // Perform admin action on user account: deactivate/reactivate/close
  adminAction: async ({ uid, action, reason, adminUid }) => {
    return await apiCall('/admin/users/actions', {
      method: 'POST',
      // Backend expects { action, targetUid, adminUid }
      body: JSON.stringify({ action, targetUid: uid, adminUid, reason })
    });
  },

  deactivate: async (uid, adminUid, reason = '') => {
    return await usersAPI.adminAction({ uid, action: 'deactivate', reason, adminUid });
  },

  reactivate: async (uid, adminUid) => {
    return await usersAPI.adminAction({ uid, action: 'reactivate', adminUid });
  },

  close: async (uid, adminUid, reason = '') => {
    return await usersAPI.adminAction({ uid, action: 'close', reason, adminUid });
  }
};

// Contact API functions
export const contactAPI = {
  // Fetch allowed subjects (optional; frontend has fallbacks)
  getSubjects: async () => {
    return await apiCall('/contact/subjects');
  },

  // Send contact message to admin
  send: async ({ name, email, subject, message }) => {
    return await apiCall('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, subject, message })
    });
  }
};

// Trade-In API functions
export const tradeInAPI = {
  // Submit a trade-in request
  submit: async (tradeInData) => {
    return await apiCall('/trade-in/submit', {
      method: 'POST',
      body: JSON.stringify(tradeInData)
    });
  },

  // Get trade-in status by reference
  getStatus: async (reference) => {
    return await apiCall(`/trade-in/status/${reference}`);
  },

  // Get user's trade-in history
  getHistory: async (userUid) => {
    return await apiCall(`/trade-in/history?uid=${userUid}`);
  },

  // Get estimated value for a device (quick quote)
  getEstimate: async (deviceInfo) => {
    return await apiCall('/trade-in/estimate', {
      method: 'POST',
      body: JSON.stringify(deviceInfo)
    });
  },

  // Cancel a trade-in request
  cancel: async (reference, userUid) => {
    return await apiCall('/trade-in/cancel', {
      method: 'POST',
      body: JSON.stringify({ reference, userUid })
    });
  },

  // Admin: list trade-ins
  adminList: async (limit = 200) => {
    return await apiCall(`/admin/trade-in?limit=${limit}`);
  },

  // Admin: update trade-in status/value/notes
  adminUpdate: async ({ reference, status, finalValue = null, notes = '' }) => {
    return await apiCall('/admin/trade-in/update', {
      method: 'POST',
      body: JSON.stringify({ reference, status, finalValue, notes })
    });
  }
};

// Notification API functions
export const notificationsAPI = {
  // Send an email notification
  sendEmail: async ({ to, subject, body, templateId, templateData }) => {
    return await apiCall('/notifications/email', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body, templateId, templateData })
    });
  },

  // Get user notifications
  getUserNotifications: async (userUid) => {
    return await apiCall(`/notifications/user/${userUid}`);
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await apiCall(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  // Subscribe to email notifications
  subscribe: async ({ email, types }) => {
    return await apiCall('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, types })
    });
  },

  // Unsubscribe from email notifications
  unsubscribe: async ({ email, types }) => {
    return await apiCall('/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email, types })
    });
  }
};

// Health check
export const healthCheck = async () => {
  return await apiCall('/health');
};

const api = {
  auth: authAPI,
  gadgets: gadgetsAPI,
  payments: paymentsAPI,
  orders: ordersAPI,
  admin: adminAPI,
  bookings: bookingsAPI,
  appointments: appointmentsAPI,
  users: usersAPI,
  contact: contactAPI,
  tradeIn: tradeInAPI,
  notifications: notificationsAPI,
  healthCheck
};

export default api;