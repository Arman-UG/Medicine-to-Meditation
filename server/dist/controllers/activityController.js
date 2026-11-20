"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHistory = exports.logCompletion = exports.getActivityBySlug = exports.getActivities = void 0;
const db_1 = require("../config/db");
const getActivities = async (req, res) => {
    try {
        const result = await db_1.pool.query(`SELECT id, name, slug, description, category, default_duration_sec, rhythm_pattern, what_to_expect
       FROM activities 
       ORDER BY CASE 
         WHEN id = 'cyclic-sighing' THEN 1
         WHEN id = 'box-breathing' THEN 2
         WHEN id = 'long-exhale' THEN 3
         WHEN id = 'seated-muscle-release' THEN 4
         WHEN id = 'grounding-54321' THEN 5
         WHEN id = 'guided-body-scan' THEN 6
         ELSE 7 END`);
        res.status(200).json({
            activities: result.rows
        });
    }
    catch (error) {
        console.error('getActivities error:', error);
        res.status(500).json({ error: 'Failed to load activities.' });
    }
};
exports.getActivities = getActivities;
const getActivityBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await db_1.pool.query(`SELECT id, name, slug, description, category, default_duration_sec, rhythm_pattern, step_instructions, what_to_expect
       FROM activities WHERE slug = $1 OR id = $1`, [slug]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Relaxation activity not found.' });
            return;
        }
        res.status(200).json({
            activity: result.rows[0]
        });
    }
    catch (error) {
        console.error('getActivityBySlug error:', error);
        res.status(500).json({ error: 'Failed to retrieve activity details.' });
    }
};
exports.getActivityBySlug = getActivityBySlug;
const logCompletion = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { activity_id, duration_completed_sec, completed, stress_level_before, notes } = req.body;
        if (!activity_id || duration_completed_sec === undefined) {
            res.status(400).json({ error: 'Activity ID and completed duration are required.' });
            return;
        }
        // Duplicate Prevention (Phase 6): Prevent duplicate submission within 15 seconds
        const recentDuplicate = await db_1.pool.query(`SELECT id, created_at FROM user_activity_logs 
       WHERE user_id = $1 AND activity_id = $2 
       AND created_at > NOW() - INTERVAL '15 seconds'
       LIMIT 1`, [userId, activity_id]);
        if (recentDuplicate.rows.length > 0) {
            res.status(200).json({
                message: 'Session recorded with peaceful gratitude.',
                log: recentDuplicate.rows[0],
                duplicatePrevented: true
            });
            return;
        }
        const result = await db_1.pool.query(`INSERT INTO user_activity_logs (user_id, activity_id, duration_completed_sec, completed, stress_level_before, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`, [userId, activity_id, Math.round(duration_completed_sec), completed !== false, stress_level_before || null, notes || null]);
        res.status(201).json({
            message: 'Session recorded with peaceful gratitude.',
            log: result.rows[0]
        });
    }
    catch (error) {
        console.error('logCompletion error:', error);
        res.status(500).json({ error: 'Failed to record activity completion.' });
    }
};
exports.logCompletion = logCompletion;
const getUserHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Strict privacy: user_id = req.user.id only. Never returns another user's records.
        const result = await db_1.pool.query(`SELECT l.id, l.duration_completed_sec, l.completed, l.created_at, a.name as activity_name, a.category, a.slug
       FROM user_activity_logs l
       JOIN activities a ON l.activity_id = a.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC
       LIMIT 30`, [userId]);
        res.status(200).json({
            history: result.rows
        });
    }
    catch (error) {
        console.error('getUserHistory error:', error);
        res.status(500).json({ error: 'Failed to load user history.' });
    }
};
exports.getUserHistory = getUserHistory;
