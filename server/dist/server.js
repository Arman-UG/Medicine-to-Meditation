"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const audioRoutes_1 = __importDefault(require("./routes/audioRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const db_1 = require("./config/db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware: CORS
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));
// Capture raw body for webhook HMAC-SHA256 signature verification
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiter for authentication routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: { error: 'Too many requests. Please pause and try again in a moment.' }
});
// Routes
app.use('/api/auth', authLimiter, authRoutes_1.default);
app.use('/api/activities', activityRoutes_1.default);
app.use('/api/audio', audioRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Health check endpoint
app.get('/api/health', async (_req, res) => {
    try {
        const dbCheck = await db_1.pool.query('SELECT NOW() as current_time');
        res.status(200).json({
            status: 'healthy',
            service: 'Medicine to Meditation API',
            database: 'connected',
            timestamp: dbCheck.rows[0].current_time
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'degraded',
            database: 'error',
            message: error?.message
        });
    }
});
// Centralized error handler
app.use((err, req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'A serene error occurred. Please try again.'
    });
});
const server = app.listen(PORT, () => {
    console.log(`🌿 Medicine to Meditation Backend API running gracefully on http://localhost:${PORT}`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server smoothly');
    server.close(() => {
        db_1.pool.end();
        console.log('Database pool and HTTP server closed.');
    });
});
exports.default = app;
