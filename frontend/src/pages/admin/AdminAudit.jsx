import { useState, useEffect } from 'react';
import styles from './AdminTables.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken()    { return localStorage.getItem('token'); }
function formatDate(d) { try { return d ? new Date(d).toLocaleString() : '—'; } catch { return '—'; } }

const METHOD_COLORS = {
  GET:    'var(--success)',
  POST:   'var(--accent2)',
  PUT:    'var(--warning)',
  PATCH:  'var(--warning)',
  DELETE: 'var(--danger)',
};

export default function AdminAudit() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [view, setView]       = useState('timeline'); // timeline | table

  useEffect(() => {
    fetch(API + '/api/admin/audit-logs?limit=200', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((data) => setLogs(data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const displayed = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.action || '').toLowerCase().includes(s) ||
           (l.request_path || '').toLowerCase().includes(s) ||
           (l.ip_address || '').includes(s);
  });

  return (
    <div className={styles.page}>
      <h1>📜 Audit Logs</h1>
      <p className={styles.subtitle}>Security audit trail of system actions</p>

      {!loading && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Filter by action, path, IP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterBtns}>
            <button
              className={`${styles.filterBtn} ${view === 'timeline' ? styles.active : ''}`}
              onClick={() => setView('timeline')}
            >
              📅 Timeline
            </button>
            <button
              className={`${styles.filterBtn} ${view === 'table' ? styles.active : ''}`}
              onClick={() => setView('table')}
            >
              📋 Table
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : view === 'timeline' ? (
        <div className={styles.tableWrap}>
          <div className={styles.timeline}>
            {displayed.map((l) => (
              <div key={l.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineHead}>
                    <span className={styles.timelineAction}>{l.action}</span>
                    {l.request_method && (
                      <span
                        className={styles.badge}
                        style={{
                          background: `${METHOD_COLORS[l.request_method] || 'var(--accent)'}18`,
                          color: METHOD_COLORS[l.request_method] || 'var(--accent)',
                          borderColor: `${METHOD_COLORS[l.request_method] || 'var(--accent)'}40`,
                        }}
                      >
                        {l.request_method}
                      </span>
                    )}
                    {l.status_code && (
                      <span className={l.status_code < 400 ? styles.badgeGenuine : styles.badgeFake}>
                        {l.status_code}
                      </span>
                    )}
                  </div>
                  <div className={styles.timelineDetail}>
                    {l.request_path && <span>{l.request_path}</span>}
                    {l.ip_address   && <span> · {l.ip_address}</span>}
                    {l.resource     && <span> · {l.resource}</span>}
                  </div>
                  <div className={styles.timelineMeta}>{formatDate(l.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>User ID</th><th>Action</th>
                <th>Method</th><th>Path</th>
                <th>Status</th><th>IP</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((l) => (
                <tr key={l.id}>
                  <td className={styles.mono}>{l.id}</td>
                  <td className={styles.mono}>{l.user_id ?? '—'}</td>
                  <td>{l.action}</td>
                  <td>
                    {l.request_method && (
                      <span className={styles.badge}
                        style={{
                          color: METHOD_COLORS[l.request_method] || 'var(--accent)',
                        }}>
                        {l.request_method}
                      </span>
                    )}
                  </td>
                  <td className={styles.path}>{l.request_path || '—'}</td>
                  <td>
                    <span className={l.status_code && l.status_code < 400 ? styles.badgeGenuine : styles.badgeFake}>
                      {l.status_code ?? '—'}
                    </span>
                  </td>
                  <td className={styles.mono}>{l.ip_address || '—'}</td>
                  <td className={styles.mono}>{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
