"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMembershipAccess = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const JWT_SECRET = process.env.JWT_SECRET || 'calm_production_jwt_secret_key_8492847291048123';
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.cookies?.token || null);
    if (!token) {
        res.status(401).json({ error: 'Access token required. Please sign in.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Server-side database verification to ensure user still exists and fetch trial dates
        const userRes = await db_1.pool.query('SELECT id, email, full_name, role, trial_started_at, trial_expires_at FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rows.length === 0) {
            res.status(401).json({ error: 'User no longer exists.' });
            return;
        }
        req.user = userRes.rows[0];
        next();
    }
    catch (err) {
        res.status(403).json({ error: 'Invalid or expired session. Please sign in again.' });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Server-side enforcement of 72-hour trial & active subscription (Phase 2)
 */
const verifyMembershipAccess = async (req, res, next) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (userRole === 'admin') {
        next();
        return;
    }
    try {
        // 1. Check for active paid subscription
        const subRes = await db_1.pool.query(`SELECT id, status, current_period_end 
       FROM subscriptions 
       WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()
       LIMIT 1`, [userId]);
        if (subRes.rows.length > 0) {
            next();
            return;
        }
        // 2. Check 72-hour free trial validity
        const userRes = await db_1.pool.query(`SELECT trial_expires_at FROM users WHERE id = $1`, [userId]);
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
    }
    catch (error) {
        console.error('verifyMembershipAccess error:', error);
        res.status(500).json({ error: 'Error verifying membership status.' });
    }
};
exports.verifyMembershipAccess = verifyMembershipAccess;
