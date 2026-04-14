import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './AdminDashboard.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken() { return localStorage.getItem('token'); }

/** Animated counter */
function useCountUp(target, duration = 900) {
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

const CARDS = [
  { key: 'total_users',             label: 'Total Users',           icon: '👥', color: 'var(--accent2)' },
  { key: 'total_detections',        label: 'Total Detections',      icon: '🔬', color: 'var(--accent)'  },
  { key: 'fake_accounts_detected',  label: 'Fake Detected',         icon: '⚠️', color: 'var(--danger)'  },
  { key: 'total_login_attempts',    label: 'Login Attempts',        icon: '🔐', color: 'var(--warning)' },
];

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(API + '/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const users      = useCountUp(stats?.total_users            ?? 0);
  const detections = useCountUp(stats?.total_detections       ?? 0);
  const fakes      = useCountUp(stats?.fake_accounts_detected ?? 0);
  const attempts   = useCountUp(stats?.total_login_attempts   ?? 0);
  const animated   = { total_users: users, total_detections: detections, fake_accounts_detected: fakes, total_login_attempts: attempts };

  if (loading) return <p className={styles.muted}>Loading…</p>;
  if (!stats)  return <p className={styles.muted}>Failed to load stats.</p>;

  return (
    <div className={styles.page}>
      <h1>📊 Admin Dashboard</h1>
      <p className={styles.subtitle}>System overview and security metrics</p>

      <div className={styles.cards}>
        {CARDS.map(({ key, label, icon, color }) => (
          <div key={key} className={styles.card} style={{ '--card-accent': color }}>
            <div className={styles.cardTop}>
              <span className={styles.cardLabel}>{label}</span>
              <span className={styles.icon}>{icon}</span>
            </div>
            <p className={styles.value} style={{ color }}>{animated[key]}</p>
          </div>
        ))}
      </div>

      {/* Fake rate bar */}
      {stats.total_detections > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.8rem', color:'var(--text-muted)', marginBottom:'.5rem' }}>
            <span>Genuine: {stats.total_detections - stats.fake_accounts_detected}</span>
            <span>Fake: {stats.fake_accounts_detected}</span>
          </div>
          <div style={{ height:'8px', borderRadius:'99px', background:'var(--border)', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:'99px',
              background:'linear-gradient(90deg, var(--success), var(--warning), var(--danger))',
              width:`${Math.round((stats.fake_accounts_detected / stats.total_detections) * 100)}%`,
              transition:'width .8s ease',
            }} />
          </div>
        </div>
      )}

      <div className={styles.links}>
        <Link to="/admin/users"          className={styles.link}>👥 View Users</Link>
        <Link to="/admin/detections"     className={styles.link}>🔬 Detections</Link>
        <Link to="/admin/audit"          className={styles.link}>📜 Audit Logs</Link>
        <Link to="/admin/login-attempts" className={styles.link}>🔐 Login Attempts</Link>
      </div>
    </div>
  );
}
