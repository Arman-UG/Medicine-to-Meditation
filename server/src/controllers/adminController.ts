import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'user'`);
    
    // Active paid subscribers
    const activeSubCount = await pool.query(
      `SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND current_period_end > NOW()`
    );

    // Expired paid subscribers
    const expiredSubCount = await pool.query(
      `SELECT COUNT(*) FROM subscriptions WHERE current_period_end <= NOW()`
    );

    // Active 72-hour trial users (no active paid subscription)
    const activeTrialCount = await pool.query(
      `SELECT COUNT(*) FROM users u
       WHERE u.role = 'user' 
         AND u.trial_expires_at > NOW()
         AND NOT EXISTS (
           SELECT 1 FROM subscriptions s 
           WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
         )`
    );

    // Expired trial users (no active paid subscription)
    const expiredTrialCount = await pool.query(
      `SELECT COUNT(*) FROM users u
       WHERE u.role = 'user' 
         AND (u.trial_expires_at <= NOW() OR u.trial_expires_at IS NULL)
         AND NOT EXISTS (
           SELECT 1 FROM subscriptions s 
           WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
         )`
    );

    const totalRevenueRes = await pool.query(
      `SELECT COALESCE(SUM(amount_paise), 0) as total FROM payment_transactions WHERE status = 'success'`
    );
    const pendingOrdersCount = await pool.query(
      `SELECT COUNT(*) FROM payment_orders WHERE status = 'created' AND expires_at > NOW()`
    );
    const failedTxCount = await pool.query(
      `SELECT COUNT(*) FROM payment_transactions WHERE status = 'failed'`
    );

    res.status(200).json({
      stats: {
        totalUsers: parseInt(userCount.rows[0].count, 10),
        activeSubscribers: parseInt(activeSubCount.rows[0].count, 10),
        expiredSubscribers: parseInt(expiredSubCount.rows[0].count, 10),
        activeTrialUsers: parseInt(activeTrialCount.rows[0].count, 10),
        expiredTrialUsers: parseInt(expiredTrialCount.rows[0].count, 10),
        totalRevenueRupees: (parseInt(totalRevenueRes.rows[0].total, 10) / 100),
        pendingOrders: parseInt(pendingOrdersCount.rows[0].count, 10),
        failedTransactions: parseInt(failedTxCount.rows[0].count, 10)
      }
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ error: 'Failed to load administrator statistics.' });
  }
};

export const getUsersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.stress_level, u.created_at,
              u.trial_started_at, u.trial_expires_at,
              s.id as subscription_id, s.status as subscription_status, s.renewal_type, s.current_period_end,
              rp.preferred_mode, rp.autopay_consent
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       LEFT JOIN renewal_preferences rp ON u.id = rp.user_id
       ORDER BY u.created_at DESC`
    );

    const now = new Date();

    const formattedUsers = result.rows.map(user => {
      let membershipCategory = 'Free Preview';
      let badgeColor = 'gray';

      const isSubActive = user.subscription_status === 'active' && user.current_period_end && new Date(user.current_period_end) > now;
      const isSubExpired = user.subscription_status && (!user.current_period_end || new Date(user.current_period_end) <= now);
      const isTrialActive = user.trial_expires_at && new Date(user.trial_expires_at) > now;

      if (isSubActive) {
        membershipCategory = 'Active Subscriber';
        badgeColor = 'green';
      } else if (isTrialActive) {
        const diffMs = new Date(user.trial_expires_at).getTime() - now.getTime();
        const hrs = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
        membershipCategory = `Active Trial (${hrs}h left)`;
        badgeColor = 'blue';
      } else if (isSubExpired) {
        membershipCategory = 'Expired Subscriber';
        badgeColor = 'orange';
      } else {
        membershipCategory = 'Expired Trial';
        badgeColor = 'red';
      }

      const computedStatus = isSubActive
        ? 'subscribed'
        : isTrialActive
        ? 'trial_active'
        : isSubExpired
        ? 'subscription_expired'
        : 'trial_expired';

      return {
        ...user,
        membership_category: membershipCategory,
        computed_status: computedStatus,
        badge_color: badgeColor
      };
    });

    res.status(200).json({
      users: formattedUsers
    });
  } catch (error) {
    console.error('getUsersList error:', error);
    res.status(500).json({ error: 'Failed to fetch registered users.' });
  }
};

export const getPaymentsList = async (req: Request, res: Response): Promise<void> => {
  try {
    const ordersRes = await pool.query(
      `SELECT o.id, o.razorpay_order_id, o.amount_paise, o.currency, o.status, o.renewal_mode, o.created_at, o.expires_at,
              u.email as user_email, u.full_name as user_name,
              t.razorpay_payment_id, t.status as transaction_status, t.payment_method, t.created_at as paid_at
       FROM payment_orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN payment_transactions t ON o.id = t.order_id
       ORDER BY o.created_at DESC
       LIMIT 50`
    );

    res.status(200).json({
      payments: ordersRes.rows
    });
  } catch (error) {
    console.error('getPaymentsList error:', error);
    res.status(500).json({ error: 'Failed to fetch payment records.' });
  }
};

export const getSubscriptionsList = async (req: Request, res: Response): Promise<void> => {
  try {
    const subsRes = await pool.query(
      `SELECT s.id, s.plan_name, s.amount_paise, s.currency, s.status, s.renewal_type, 
              s.current_period_start, s.current_period_end, s.next_billing_at, s.cancelled_at, s.created_at,
              u.email as user_email, u.full_name as user_name,
              m.mandate_token, m.status as mandate_status, m.upi_vpa
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN payment_mandates m ON s.id = m.subscription_id
       ORDER BY s.created_at DESC`
    );

    res.status(200).json({
      subscriptions: subsRes.rows
    });
  } catch (error) {
    console.error('getSubscriptionsList error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions.' });
  }
};

export const updateActivityContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, default_duration_sec, step_instructions, rhythm_pattern } = req.body;

    const result = await pool.query(
      `UPDATE activities
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           default_duration_sec = COALESCE($4, default_duration_sec),
           step_instructions = COALESCE($5, step_instructions),
           rhythm_pattern = COALESCE($6, rhythm_pattern),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description, category, default_duration_sec, step_instructions ? JSON.stringify(step_instructions) : null, rhythm_pattern ? JSON.stringify(rhythm_pattern) : null, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Activity not found.' });
      return;
    }

    res.status(200).json({
      message: 'Activity updated successfully.',
      activity: result.rows[0]
    });
  } catch (error) {
    console.error('updateActivityContent error:', error);
    res.status(500).json({ error: 'Failed to update activity content.' });
  }
};

export const updateAudioTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, artist, category, frequency_hz, duration_sec } = req.body;

    const result = await pool.query(
      `UPDATE audio_tracks
       SET title = COALESCE($1, title),
           artist = COALESCE($2, artist),
           category = COALESCE($3, category),
           frequency_hz = COALESCE($4, frequency_hz),
           duration_sec = COALESCE($5, duration_sec)
       WHERE id = $6
       RETURNING *`,
      [title, artist, category, frequency_hz, duration_sec, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Audio track not found.' });
      return;
    }

    res.status(200).json({
      message: 'Audio track updated successfully.',
      track: result.rows[0]
    });
  } catch (error) {
    console.error('updateAudioTrack error:', error);
    res.status(500).json({ error: 'Failed to update audio track.' });
  }
};
