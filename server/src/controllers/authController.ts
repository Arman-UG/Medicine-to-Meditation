import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'calm_production_jwt_secret_key_8492847291048123';

/**
 * Computes authoritative server-side membership status based on subscription and 72-hour trial.
 */
export function computeMembershipStatus(user: any, activeSub: any, hadAnySub: boolean = false) {
  const now = new Date();

  // 1. Active Paid Subscription
  if (activeSub && activeSub.status === 'active' && new Date(activeSub.current_period_end) > now) {
    return {
      tier: 'subscribed',
      label: 'Subscribed',
      isPro: true,
      hasAccess: true,
      daysRemaining: null,
      hoursRemaining: null,
      currentPeriodEnd: activeSub.current_period_end,
      renewalType: activeSub.renewal_type || 'manual'
    };
  }

  // 2. 72-Hour Free Trial
  const trialEnd = user.trial_expires_at ? new Date(user.trial_expires_at) : new Date(0);
  if (now < trialEnd) {
    const diffMs = trialEnd.getTime() - now.getTime();
    const hoursRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const label = daysRemaining > 1 
      ? `Free Trial — ${daysRemaining} days remaining` 
      : `Free Trial — ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} remaining`;

    return {
      tier: 'trial_active',
      label,
      isPro: false,
      hasAccess: true,
      daysRemaining,
      hoursRemaining,
      trialStartedAt: user.trial_started_at,
      trialExpiresAt: user.trial_expires_at
    };
  }

  // 3. Expired States
  if (hadAnySub) {
    return {
      tier: 'subscription_expired',
      label: 'Subscription Expired',
      isPro: false,
      hasAccess: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      trialExpiresAt: user.trial_expires_at
    };
  }

  return {
    tier: 'trial_expired',
    label: 'Trial Expired',
    isPro: false,
    hasAccess: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    trialExpiresAt: user.trial_expires_at
  };
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, stress_level } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Please provide full name, email, and password.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    // Abuse prevention: Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [emailNormalized]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validStress = ['mild', 'moderate', 'high'].includes(stress_level) ? stress_level : null;

    // 72-hour free trial starts immediately on account creation
    const insertUserRes = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, stress_level, trial_started_at, trial_expires_at)
       VALUES ($1, $2, $3, 'user', $4, NOW(), NOW() + INTERVAL '72 hours')
       RETURNING id, email, full_name, role, stress_level, trial_started_at, trial_expires_at, created_at`,
      [emailNormalized, passwordHash, full_name.trim(), validStress]
    );

    const newUser = insertUserRes.rows[0];

    // Initialize renewal preferences
    await pool.query(
      `INSERT INTO renewal_preferences (user_id, preferred_mode, autopay_consent)
       VALUES ($1, 'manual', false)
       ON CONFLICT (user_id) DO NOTHING`,
      [newUser.id]
    );

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const membership = computeMembershipStatus(newUser, null, false);

    res.status(201).json({
      message: 'Account created successfully. Your 72-hour free trial is active.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        stress_level: newUser.stress_level,
        trial_started_at: newUser.trial_started_at,
        trial_expires_at: newUser.trial_expires_at,
        subscription: null,
        membership
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Unable to complete registration. Please try again later.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    const userRes = await pool.query(
      `SELECT id, email, password_hash, full_name, role, stress_level, trial_started_at, trial_expires_at 
       FROM users WHERE email = $1`,
      [emailNormalized]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Fetch active subscription status
    const subRes = await pool.query(
      `SELECT id, status, plan_name, renewal_type, current_period_end, next_billing_at
       FROM subscriptions 
       WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()
       ORDER BY current_period_end DESC LIMIT 1`,
      [user.id]
    );

    // Check if user ever had any subscription
    const anySubRes = await pool.query(
      `SELECT id FROM subscriptions WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const activeSub = subRes.rows[0] || null;
    const membership = computeMembershipStatus(user, activeSub, anySubRes.rows.length > 0);

    res.status(200).json({
      message: 'Welcome back.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        stress_level: user.stress_level,
        trial_started_at: user.trial_started_at,
        trial_expires_at: user.trial_expires_at,
        subscription: activeSub,
        membership
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to sign in. Please try again later.' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const userRes = await pool.query(
      `SELECT id, email, full_name, role, stress_level, trial_started_at, trial_expires_at, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const user = userRes.rows[0];

    const subRes = await pool.query(
      `SELECT id, status, plan_name, amount_paise, renewal_type, current_period_start, current_period_end, next_billing_at, cancelled_at
       FROM subscriptions 
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const renewalRes = await pool.query(
      `SELECT preferred_mode, autopay_consent, consent_timestamp 
       FROM renewal_preferences WHERE user_id = $1`,
      [userId]
    );

    const mandateRes = await pool.query(
      `SELECT id, mandate_token, upi_vpa, status, authorized_at 
       FROM payment_mandates WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const activeSub = (subRes.rows[0]?.status === 'active' && new Date(subRes.rows[0].current_period_end) > new Date())
      ? subRes.rows[0]
      : null;

    const membership = computeMembershipStatus(user, activeSub, subRes.rows.length > 0);

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        stress_level: user.stress_level,
        trial_started_at: user.trial_started_at,
        trial_expires_at: user.trial_expires_at,
        created_at: user.created_at,
        membership
      },
      subscription: subRes.rows[0] || null,
      renewal_preferences: renewalRes.rows[0] || { preferred_mode: 'manual', autopay_consent: false },
      active_mandate: mandateRes.rows[0] || null
    });
  } catch (error) {
    console.error('GetProfile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

export const updateStressLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { stress_level } = req.body;

    const validLevel = ['mild', 'moderate', 'high'].includes(stress_level) ? stress_level : null;

    await pool.query(
      `UPDATE users SET stress_level = $1, updated_at = NOW() WHERE id = $2`,
      [validLevel, userId]
    );

    res.status(200).json({
      message: 'Preference updated.',
      stress_level: validLevel
    });
  } catch (error) {
    console.error('Update stress level error:', error);
    res.status(500).json({ error: 'Failed to update stress level.' });
  }
};

export const updateRenewalPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { preferred_mode, autopay_consent } = req.body;

    const mode = preferred_mode === 'autopay' ? 'autopay' : 'manual';
    const consent = Boolean(autopay_consent);

    const result = await pool.query(
      `INSERT INTO renewal_preferences (user_id, preferred_mode, autopay_consent, consent_timestamp, updated_at)
       VALUES ($1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET preferred_mode = EXCLUDED.preferred_mode,
           autopay_consent = EXCLUDED.autopay_consent,
           consent_timestamp = CASE WHEN EXCLUDED.autopay_consent THEN NOW() ELSE NULL END,
           updated_at = NOW()
       RETURNING *`,
      [userId, mode, consent]
    );

    // If subscription exists, update subscription renewal_type
    await pool.query(
      `UPDATE subscriptions 
       SET renewal_type = $1, updated_at = NOW() 
       WHERE user_id = $2 AND status = 'active'`,
      [mode, userId]
    );

    res.status(200).json({
      message: 'Renewal preferences updated successfully.',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Update renewal preferences error:', error);
    res.status(500).json({ error: 'Failed to update renewal preferences.' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [emailNormalized]);

    if (userRes.rows.length === 0) {
      res.status(200).json({ message: 'If that email address is registered, password reset instructions have been generated.' });
      return;
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2, updated_at = NOW() 
       WHERE id = $3`,
      [resetToken, expires, userRes.rows[0].id]
    );

    res.status(200).json({
      message: 'Password reset link generated.',
      resetToken
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const userRes = await pool.query(
      `SELECT id FROM users 
       WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [token]
    );

    if (userRes.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired password reset token.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() 
       WHERE id = $2`,
      [passwordHash, userRes.rows[0].id]
    );

    res.status(200).json({ message: 'Password has been reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};
