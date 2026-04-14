import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

router.post('/register', auditLog('USER_REGISTER', 'users'), async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password and full name are required' });
    }
    const emailSanitized = validator.normalizeEmail(validator.trim(email));
    if (!validator.isEmail(emailSanitized)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'user') RETURNING id, email, full_name, role, created_at`,
      [emailSanitized, hash, validator.escape(validator.trim(full_name))]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    await query(
      'INSERT INTO audit_logs (action, resource, details) VALUES ($1, $2, $3)',
      ['USER_REGISTER_SUCCESS', 'users', JSON.stringify({ email: user.email, user_id: user.id })]
    );
    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      token,
      expiresIn: process.env.JWT_EXPIRY || '7d',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', auditLog('USER_LOGIN', 'users'), async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;
    if (!email || !password) {
      await query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)', [email || '', ip]);
      return res.status(400).json({ error: 'Email and password required' });
    }
    const emailSanitized = validator.normalizeEmail(validator.trim(email));
    const result = await query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
      [emailSanitized]
    );
    if (result.rows.length === 0) {
      await query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)', [emailSanitized, ip]);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    if (!user.is_active) {
      await query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)', [emailSanitized, ip]);
      return res.status(403).json({ error: 'Account is disabled' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)', [emailSanitized, ip]);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    await query('INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, true)', [emailSanitized, ip]);
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      token,
      expiresIn: process.env.JWT_EXPIRY || '7d',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
