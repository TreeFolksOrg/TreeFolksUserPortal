// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const airtableRoutes = require('./routes/airtableRoutes');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or default

// --- Uploads directory ---
// Note: On Vercel, file system writes don't work. Use Cloudinary for file uploads.
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
// }

// --- Middleware ---
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            // Vercel deployments (legacy)
            'https://tree-folks-user-portal-frontend.vercel.app',
            // Heroku deployment
            'https://tf-reforestation-0e95d424312a.herokuapp.com',
            // Custom domain
            'https://reforestation.treefolks.org'
        ];
        // Allow requests with no origin (same-origin requests, mobile apps, curl)
        if (!origin) return callback(null, true);
        // In production combined deployment, allow same-origin
        if (process.env.NODE_ENV === 'production') return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // Allow requests from different origins (like your frontend)
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json({ limit: '50mb' })); // Parse incoming JSON requests (larger limit for base64 encoded images)
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded requests
// app.use('/uploads', express.static(uploadsDir)); // Disabled for serverless - use Cloudinary instead

// --- Cache Control Middleware ---
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
});

// --- Logging Middleware (Optional but helpful) ---
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// --- Routes ---
app.use('/api', airtableRoutes); // Mount our Airtable specific routes

// --- Serve Frontend Static Files (Heroku Combined Deployment) ---
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

// --- SPA Fallback - Serve index.html for non-API routes ---
app.get('*', (req, res, next) => {
    // Skip if this is an API route
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
        if (err) {
            // If frontend not built yet, show API status
            res.send('TreeFolks Portal API is running! Frontend not built yet.');
        }
    });
});

// --- Global Error Handler (Basic) ---
app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:");
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err : {} // Only show stack in dev
    });
});

// --- Start Server ---
// For Heroku and local development, always start the server
// For Vercel, we export the app instead
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
    const server = app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_ID) {
            console.warn('WARN: Airtable environment variables (PAT, BASE_ID, TABLE_ID) are not fully set. API calls might fail.');
        }
    });

    server.on('close', () => {
        console.log('Server Connection Closed');
    });

    process.on('SIGTERM', () => {
        console.log('Received SIGTERM');
        process.exit(0);
    });
}

// Export for Vercel serverless
module.exports = app;

