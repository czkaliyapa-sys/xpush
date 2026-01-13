/* eslint-disable import/no-extraneous-dependencies */
const { createProxyMiddleware } = require('http-proxy-middleware');

// Development-time proxy to bypass CORS for remote model assets
// Usage: /models-proxy?url=/api/models/<folder>/<file>
module.exports = function setup(app) {
  // Generic API proxy to backend to avoid CORS in development
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://www.sparkle-pro.co.uk',
      changeOrigin: true,
      secure: true,
      xfwd: true,
      // Keep the /api prefix so /api/... maps to https://sparkle-pro.co.uk/api/...
      pathRewrite: {
        '^/api': '/api',
      },
      onProxyRes(proxyRes) {
        proxyRes.headers['Cache-Control'] = 'no-store';
      },
    })
  );

  const makeProxy = () =>
    createProxyMiddleware({
      target: 'https://www.sparkle-pro.co.uk',
      changeOrigin: true,
      secure: true,
      xfwd: true,
      // Dynamically rewrite the path using the provided `url` query parameter
      pathRewrite: (path, req) => {
        try {
          const raw = (req.query && req.query.url) || '';
          if (!raw) return path; // leave unchanged; will 404
          const parsed = new URL(raw, 'https://www.sparkle-pro.co.uk');

          // Only allow whitelisted paths
          const p = parsed.pathname || '';
          if (!/^\/(api\/models|models_extracted)\//i.test(p)) {
            return '/__invalid_path__';
          }
          return p + (parsed.search || '');
        } catch (e) {
          return '/__invalid_path__';
        }
      },
      // Ensure we don't accidentally cache negative responses during dev
      onProxyRes(proxyRes) {
        proxyRes.headers['Cache-Control'] = 'no-store';
      },
    });

  // Support both routes for flexibility
  app.use('/models-proxy', (req, res, next) => makeProxy()(req, res, next));
  app.use('/api/models-proxy', (req, res, next) => makeProxy()(req, res, next));
};