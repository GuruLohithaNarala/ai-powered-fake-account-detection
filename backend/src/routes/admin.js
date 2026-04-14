import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/users', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, is_active, email_verified, created_at, last_login_at
       FROM users ORDER BY created_at DESC LIMIT 500`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const result = await query(
      `SELECT id, user_id, action, resource, resource_id, ip_address, request_method, request_path, status_code, created_at
       FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/detections', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const result = await query(
      `SELECT dr.id, dr.user_id, u.email, dr.is_fake_prediction, dr.fake_probability, dr.risk_score, dr.model_version, dr.created_at
       FROM detection_results dr
       LEFT JOIN users u ON u.id = dr.user_id
       ORDER BY dr.created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ detections: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch detections' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const usersCount = await query('SELECT COUNT(*) AS c FROM users');
    const detectionsCount = await query('SELECT COUNT(*) AS c FROM detection_results');
    const fakeCount = await query('SELECT COUNT(*) AS c FROM detection_results WHERE is_fake_prediction = true');
    const loginAttemptsCount = await query('SELECT COUNT(*) AS c FROM login_attempts');
    res.json({
      total_users: parseInt(usersCount.rows[0]?.c || 0, 10),
      total_detections: parseInt(detectionsCount.rows[0]?.c || 0, 10),
      fake_accounts_detected: parseInt(fakeCount.rows[0]?.c || 0, 10),
      total_login_attempts: parseInt(loginAttemptsCount.rows[0]?.c || 0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/login-attempts', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const result = await query(
      `SELECT id, email, ip_address, success, created_at FROM login_attempts ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ attempts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch login attempts' });
  }
});

export default router;
