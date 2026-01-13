const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const app = express();

// -----------------------------
// Compression
// -----------------------------
app.use(compression());

// -----------------------------
// CORS
// -----------------------------
const allowedOrigins = ['https://www.itsxtrapush.com'];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true); // allow Postman, curl
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS not allowed'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// -----------------------------
// Security + CSP headers
// -----------------------------
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://js.stripe.com https://m.stripe.network https://apis.google.com https://www.gstatic.com 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https://api.stripe.com https://m.stripe.network https://apis.google.com https://www.googleapis.com https://firebase.googleapis.com; frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://*.firebaseapp.com;");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

// -----------------------------
// Body parsing for POST requests
// -----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------
// API routes (Node.js backend)
// -----------------------------
const apiRouter = express.Router();

// Example: /api/signin
apiRouter.post('/signin', (req, res) => {
    const { method } = req.query; // e.g., method=google
    // implement your backend logic here
    res.json({ success: true, method, message: 'Signed in via Node.js backend' });
});

// Example: /api/hello
apiRouter.get('/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js API' });
});

app.use('/api', apiRouter);

// -----------------------------
// Serve React build (frontend)
// -----------------------------
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// SPA fallback: redirect all non-API routes to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
