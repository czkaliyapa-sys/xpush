// Analytics API Service for Xtrapush
// Captures sessions, page views, and events for richer analytics

const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'development' ? '/api' : 'https://sparkle-pro.co.uk/api'
);

class AnalyticsAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };

    try {
      const res = await fetch(url, config);
      // analytics should be fire-and-forget; avoid throwing on non-200
      const data = await res.json().catch(() => ({ success: false }));
      return data;
    } catch (e) {
      // swallow errors to avoid impacting UX
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Analytics request failed:', endpoint, e?.message || e);
      }
      return { success: false };
    }
  }

  async startSession(sessionId = null, uid = null) {
    const payload = {};
    if (sessionId) payload.sessionId = sessionId;
    if (uid) payload.uid = uid;
    return this.request('/analytics/session/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async recordPageView(sessionId, path, title = null) {
    if (!sessionId || !path) return { success: false };
    return this.request('/analytics/pageview', {
      method: 'POST',
      body: JSON.stringify({ sessionId, path, title }),
    });
  }

  async recordEvent(sessionId, eventType, data = null) {
    if (!sessionId || !eventType) return { success: false };
    return this.request('/analytics/event', {
      method: 'POST',
      body: JSON.stringify({ sessionId, eventType, data }),
    });
  }
}

const analyticsAPI = new AnalyticsAPI();
// Export wrapper functions to preserve the class context (this)
export const startSession = (...args) => analyticsAPI.startSession(...args);
export const recordPageView = (...args) => analyticsAPI.recordPageView(...args);
export const recordEvent = (...args) => analyticsAPI.recordEvent(...args);
export default analyticsAPI;
