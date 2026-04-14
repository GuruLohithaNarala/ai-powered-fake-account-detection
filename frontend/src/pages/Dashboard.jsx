import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken() { return localStorage.getItem('token'); }

/** Animated counter hook */
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

/** SVG Progress Ring */
function Ring({ pct, color = 'var(--accent)' }) {
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className={styles.ringWrap}>
      <svg width={52} height={52} className={styles.ring} viewBox="0 0 52 52">
        <circle className={styles.ringTrack} cx={26} cy={26} r={r} />
        <circle
          className={styles.ringFill}
          cx={26} cy={26} r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={styles.ringLabel}>{pct}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_detections: 0, fake_detected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(API + '/api/detection/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { total_detections: 0, fake_detected: 0 })
      .then(setStats)
      .catch(() => setStats({ total_detections: 0, fake_detected: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const totalAnim   = useCountUp(loading ? 0 : stats.total_detections);
  const fakeAnim    = useCountUp(loading ? 0 : stats.fake_detected);
  const fakeRate    = stats.total_detections > 0
    ? Math.round((stats.fake_detected / stats.total_detections) * 100)
    : 0;
  const genuineAnim = useCountUp(loading ? 0 : (stats.total_detections - stats.fake_detected));

  return (
    <div className={styles.dashboard}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}>🛡 AI-Powered Detection</div>
        <h1>Welcome back, {user?.full_name || 'User'} 👋</h1>
        <p className={styles.heroSub}>
          Use ML-powered detection to identify fake or suspicious social media
          accounts based on behavior and profile signals.
        </p>
      </div>

      {/* Stat Cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>Total Analyses</span>
            <span className={styles.cardIcon}>📊</span>
          </div>
          <p className={styles.cardValue}>{loading ? '—' : totalAnim}</p>
          <p className={styles.cardSub}>Detections run so far</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>Fake Detected</span>
            <span className={styles.cardIcon}>⚠️</span>
          </div>
          <p className={styles.cardValue} style={{ color: 'var(--danger)' }}>
            {loading ? '—' : fakeAnim}
          </p>
          <p className={styles.cardSub}>Suspicious accounts found</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>Genuine</span>
            <span className={styles.cardIcon}>✅</span>
          </div>
          <p className={styles.cardValue} style={{ color: 'var(--success)' }}>
            {loading ? '—' : genuineAnim}
          </p>
          <p className={styles.cardSub}>Legitimate accounts</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>Fake Rate</span>
            <Ring pct={fakeRate} color={fakeRate > 50 ? 'var(--danger)' : 'var(--accent)'} />
          </div>
          <p className={styles.cardValue}>{loading ? '—' : fakeRate + '%'}</p>
          <p className={styles.cardSub}>Of total analyses</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>ML Model</span>
            <span className={styles.cardIcon}>🤖</span>
          </div>
          <p className={styles.cardValue} style={{ fontSize: '1rem', marginTop: '.4rem' }}>
            Random Forest
          </p>
          <p className={styles.cardSub}>10K+ training profiles</p>
        </div>
      </div>

      {/* Fake rate progress bar */}
      {!loading && stats.total_detections > 0 && (
        <div className={styles.fakeRateBar}>
          <div className={styles.fakeRateLabel}>
            <span>Genuine ✅ {100 - fakeRate}%</span>
            <span>Fake ⚠ {fakeRate}%</span>
          </div>
          <div className={styles.fakeRateTrack}>
            <div className={styles.fakeRateFill} style={{ width: `${fakeRate}%` }} />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className={styles.cta}>
        <Link to="/detect" className={styles.ctaButton}>🔬 Analyze an account</Link>
        <Link to="/history" className={styles.ctaSecondary}>📋 View history</Link>
      </div>

      {/* How it works */}
      <div className={styles.info}>
        <h3>How it works</h3>
        <ul>
          <li><strong>Profile &amp; activity:</strong> Account age, followers/following, post count, posting frequency.</li>
          <li><strong>Behavior signals:</strong> Following/follower ratio, engagement rate, profile completeness (photo, bio).</li>
          <li><strong>ML model:</strong> Trained on 10K+ synthetic profiles; outputs risk score and fake/genuine prediction.</li>
        </ul>
      </div>
    </div>
  );
}
