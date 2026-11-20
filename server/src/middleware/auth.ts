import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
    trial_started_at?: string;
    trial_expires_at?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'calm_production_jwt_secret_key_8492847291048123';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.cookies?.token || null);

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please sign in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    
    // Server-side database verification to ensure user still exists and fetch trial dates
    const userRes = await pool.query(
      'SELECT id, email, full_name, role, trial_started_at, trial_expires_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
    return;
  }
  next();
};

/**
 * Server-side enforcement of 72-hour trial & active subscription (Phase 2)
 */
export const verifyMembershipAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole === 'admin') {
    next();
    return;
  }

  try {
    // 1. Check for active paid subscription
    const subRes = await pool.query(
      `SELECT id, status, current_period_end 
       FROM subscriptions 
       WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()
       LIMIT 1`,
      [userId]
    );

    if (subRes.rows.length > 0) {
      next();
      return;
    }

    // 2. Check 72-hour free trial validity
    const userRes = await pool.query(
      `SELECT trial_expires_at FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length > 0 && userRes.rows[0].trial_expires_at) {
      const trialExpiresAt = new Date(userRes.rows[0].trial_expires_at);
      if (new Date() < trialExpiresAt) {
        next();
        return;
      }
    }

    // Neither active subscription nor valid trial -> Access locked server-side
    res.status(403).json({
      error: 'Your 72-hour free trial has ended. Please subscribe for ₹99/month to continue unlimited guided practices.',
      code: 'TRIAL_EXPIRED',
      requiresSubscription: true
    });
  } catch (error) {
    console.error('verifyMembershipAccess error:', error);
    res.status(500).json({ error: 'Error verifying membership status.' });
  }
};
