import { useState, useEffect } from 'react';
import styles from './AdminTables.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken()      { return localStorage.getItem('token'); }
function formatDate(d)   { try { return d ? new Date(d).toLocaleString() : '—'; } catch { return '—'; } }

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir]   = useState('desc');

  useEffect(() => {
    fetch(API + '/api/admin/users', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const arrow = (f) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const displayed = [...users]
    .filter(u => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (u.email || '').toLowerCase().includes(s) ||
             (u.full_name || '').toLowerCase().includes(s) ||
             (u.role || '').toLowerCase().includes(s);
    })
    .sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') av = av?.toLowerCase();
      if (typeof bv === 'string') bv = bv?.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const activeCount   = users.filter(u => u.is_active).length;
  const adminCount    = users.filter(u => u.role === 'admin').length;

  return (
    <div className={styles.page}>
      <h1>👥 Users</h1>
      <p className={styles.subtitle}>Registered application users</p>

      {!loading && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryChip}>Total <strong>{users.length}</strong></div>
          <div className={styles.summaryChip}>Active <strong style={{color:'var(--success)'}}>{activeCount}</strong></div>
          <div className={styles.summaryChip}>Admins <strong style={{color:'var(--accent2)'}}>{adminCount}</strong></div>
          <div className={styles.summaryChip}>Showing <strong>{displayed.length}</strong></div>
        </div>
      )}

      {!loading && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search by name, email, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                <th onClick={() => handleSort('full_name')}>Name{arrow('full_name')}</th>
                <th onClick={() => handleSort('role')}>Role{arrow('role')}</th>
                <th onClick={() => handleSort('is_active')}>Status{arrow('is_active')}</th>
                <th onClick={() => handleSort('created_at')}>Created{arrow('created_at')}</th>
                <th onClick={() => handleSort('last_login_at')}>Last Login{arrow('last_login_at')}</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((u) => (
                <tr key={u.id}>
                  <td className={styles.mono}>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.full_name}</td>
                  <td>
                    <span className={u.role === 'admin' ? styles.badgeWarn : styles.badge}>
                      {u.role === 'admin' ? '⚙ admin' : '👤 user'}
                    </span>
                  </td>
                  <td>
                    <span className={u.is_active ? styles.badgeGenuine : styles.badgeFake}>
                      {u.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td className={styles.mono}>{formatDate(u.created_at)}</td>
                  <td className={styles.mono}>{formatDate(u.last_login_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
