import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const FEATURE_ORDER = [
  'account_age_days',
  'followers_count',
  'following_count',
  'post_count',
  'posts_per_week',
  'has_profile_picture',
  'has_bio',
  'bio_length',
  'username_length',
  'following_follower_ratio',
  'engagement_rate',
];

function runPythonPredict(featuresJson) {
  return new Promise((resolve, reject) => {
    const py = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, '..', '..', '..', 'ml-model', 'predict.py');
    const child = spawn(py, [scriptPath, featuresJson], { cwd: path.dirname(scriptPath) });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(err || 'Prediction script failed'));
        return;
      }
      try {
        resolve(JSON.parse(out.trim()));
      } catch (e) {
        reject(new Error('Invalid prediction output'));
      }
    });
  });
}

router.post(
  '/predict',
  authenticateToken,
  auditLog('DETECTION_PREDICT', 'detection_results'),
  async (req, res) => {
    try {
      const body = req.body || {};
      const account_age_days = Number(body.account_age_days) ?? 0;
      const followers_count = Number(body.followers_count) ?? 0;
      const following_count = Number(body.following_count) ?? 0;
      const post_count = Number(body.post_count) ?? 0;
      const posts_per_week = Number(body.posts_per_week) ?? 0;
      const has_profile_picture = Boolean(body.has_profile_picture);
      const has_bio = Boolean(body.has_bio);
      const bio_length = Number(body.bio_length) ?? 0;
      const username_length = Number(body.username_length) ?? 0;
      const ratio = following_count > 0 && followers_count > 0 ? following_count / followers_count : 0;
      const engagement_rate = Number(body.engagement_rate) ?? 0;

      const features = {
        account_age_days,
        followers_count,
        following_count,
        post_count,
        posts_per_week,
        has_profile_picture: has_profile_picture ? 1 : 0,
        has_bio: has_bio ? 1 : 0,
        bio_length,
        username_length,
        following_follower_ratio: ratio,
        engagement_rate,
      };

      const featuresJson = JSON.stringify(features);
      const result = await runPythonPredict(featuresJson);

      const is_fake = result.prediction === 1;
      const probability = result.probability ?? (is_fake ? 0.8 : 0.2);
      const risk_score = Math.round(probability * 100);

      const profileResult = await query(
        `INSERT INTO social_account_profiles (user_id, platform, account_age_days, followers_count, following_count, post_count, posts_per_week, has_profile_picture, has_bio, bio_length, username_length, following_follower_ratio, engagement_rate, raw_features)
         VALUES ($1, 'generic', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [
          req.user.id,
          account_age_days,
          followers_count,
          following_count,
          post_count,
          posts_per_week,
          has_profile_picture,
          has_bio,
          bio_length,
          username_length,
          ratio,
          engagement_rate,
          JSON.stringify(features),
        ]
      );
      const profileId = profileResult.rows[0]?.id;

      await query(
        `INSERT INTO detection_results (user_id, profile_id, is_fake_prediction, fake_probability, risk_score, model_version, input_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user.id,
          profileId,
          is_fake,
          probability,
          risk_score,
          result.model_version || 'v1',
          JSON.stringify(features),
        ]
      );

      res.json({
        is_fake,
        risk_score,
        probability,
        model_version: result.model_version || 'v1',
        message: is_fake
          ? 'This account exhibits characteristics associated with fake or suspicious accounts.'
          : 'This account appears to show typical genuine user behavior.',
      });
    } catch (err) {
      console.error('Detection error:', err);
      res.status(500).json({
        error: 'Prediction failed. Ensure the ML model is trained and predict.py is available.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
);

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, is_fake_prediction, fake_probability, risk_score, model_version, created_at
       FROM detection_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const total = await query('SELECT COUNT(*) AS c FROM detection_results WHERE user_id = $1', [req.user.id]);
    const fake = await query(
      'SELECT COUNT(*) AS c FROM detection_results WHERE user_id = $1 AND is_fake_prediction = true',
      [req.user.id]
    );
    res.json({
      total_detections: parseInt(total.rows[0]?.c || 0, 10),
      fake_detected: parseInt(fake.rows[0]?.c || 0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
