import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminAuth.module.css';

const API = import.meta.env.VITE_API_URL || '';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(API + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.user?.role !== 'admin') {
        setError('Access denied. Admin only.');
        setLoading(false);
        return;
      }
      login(data.user, data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <span className={styles.authLogo}>⚙️</span>
        <div className={styles.badge}>🔐 Admin Portal</div>
        <h1 className={styles.title}>Admin Sign In</h1>
        <p className={styles.subtitle}>Restricted to administrators only</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>⚠ {error}</div>}

          <label>
            Admin Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ width: '100%', paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '.85rem',
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? '⏳ Signing in…' : '→ Sign in as Admin'}
          </button>
        </form>

        <p className={styles.footer}>
          <a href="/">← User Portal</a>
        </p>
      </div>
    </div>
  );
}
