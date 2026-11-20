import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import activityRoutes from './routes/activityRoutes';
import audioRoutes from './routes/audioRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import { pool } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// Capture raw body for webhook HMAC-SHA256 signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.use(express.urlencoded({ extended: true }));

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests. Please pause and try again in a moment.' }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbCheck = await pool.query('SELECT NOW() as current_time');
    res.status(200).json({
      status: 'healthy',
      service: 'Medicine to Meditation API',
      database: 'connected',
      timestamp: dbCheck.rows[0].current_time
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'degraded',
      database: 'error',
      message: error?.message
    });
  }
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, _next: any) => {
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
    pool.end();
    console.log('Database pool and HTTP server closed.');
  });
});

export default app;
