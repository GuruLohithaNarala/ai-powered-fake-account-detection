import { useState, useEffect } from 'react';
import styles from './AdminTables.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken()    { return localStorage.getItem('token'); }
function formatDate(d) { try { return d ? new Date(d).toLocaleString() : '—'; } catch { return '—'; } }

export default function AdminLoginAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');  // all | success | failed
  const [search, setSearch]     = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir]   = useState('desc');

  useEffect(() => {
    fetch(API + '/api/admin/login-attempts?limit=200', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : { attempts: [] }))
      .then((data) => setAttempts(data.attempts || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };
  const arrow = (f) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const displayed = [...attempts]
    .filter(a => {
      if (filter === 'success' && !a.success) return false;
      if (filter === 'failed'  &&  a.success) return false;
      if (search) {
        const s = search.toLowerCase();
        return (a.email || '').toLowerCase().includes(s) ||
               (a.ip_address || '').includes(s);
      }
      return true;
    })
    .sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'created_at') { av = new Date(av); bv = new Date(bv); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const successCount = attempts.filter(a => a.success).length;
  const failedCount  = attempts.length - successCount;

  return (
    <div className={styles.page}>
      <h1>🔐 Login Attempts</h1>
      <p className={styles.subtitle}>All login attempts (success and failure) for security monitoring</p>

      {!loading && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryChip}>Total <strong>{attempts.length}</strong></div>
          <div className={styles.summaryChip}>Success <strong style={{color:'var(--success)'}}>{successCount}</strong></div>
          <div className={styles.summaryChip}>Failed <strong style={{color:'var(--danger)'}}>{failedCount}</strong></div>
          <div className={styles.summaryChip}>Showing <strong>{displayed.length}</strong></div>
        </div>
      )}

      {!loading && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search by email or IP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterBtns}>
            {['all', 'success', 'failed'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>ID{arrow('id')}</th>
                <th onClick={() => handleSort('email')}>Email{arrow('email')}</th>
                <th onClick={() => handleSort('ip_address')}>IP Address{arrow('ip_address')}</th>
                <th onClick={() => handleSort('success')}>Status{arrow('success')}</th>
                <th onClick={() => handleSort('created_at')}>Time{arrow('created_at')}</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((a) => (
                <tr key={a.id}>
                  <td className={styles.mono}>{a.id}</td>
                  <td>{a.email}</td>
                  <td className={styles.mono}>{a.ip_address || '—'}</td>
                  <td>
                    <span className={a.success ? styles.badgeGenuine : styles.badgeFake}>
                      {a.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </td>
                  <td className={styles.mono}>{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
