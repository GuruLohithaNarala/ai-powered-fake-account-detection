import { useState, useEffect } from 'react';
import styles from './History.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken() { return localStorage.getItem('token'); }

function formatDate(d) {
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

function getRiskColor(score) {
  if (score >= 70) return 'var(--danger)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--success)';
}

export default function History() {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');   // all | fake | genuine
  const [search, setSearch]     = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir]   = useState('desc');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(API + '/api/detection/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { history: [] }))
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  /** Sort toggle */
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortArrow = (field) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  /** Derived filtered + sorted list */
  const displayed = [...history]
    .filter(row => {
      if (filter === 'fake'    && !row.is_fake_prediction) return false;
      if (filter === 'genuine' &&  row.is_fake_prediction) return false;
      if (search) {
        const s = search.toLowerCase();
        const dateStr = formatDate(row.created_at).toLowerCase();
        const model   = (row.model_version || '').toLowerCase();
        return dateStr.includes(s) || model.includes(s) ||
          String(row.risk_score).includes(s);
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

  /** Export CSV */
  const exportCSV = () => {
    const header = ['Date', 'Result', 'Risk%', 'Probability%', 'Model'];
    const rows   = displayed.map(r => [
      formatDate(r.created_at),
      r.is_fake_prediction ? 'Fake' : 'Genuine',
      r.risk_score,
      (r.fake_probability * 100).toFixed(1),
      r.model_version || '',
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'detection_history.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const fakeCount    = history.filter(r => r.is_fake_prediction).length;
  const genuineCount = history.length - fakeCount;

  return (
    <div className={styles.page}>
      <h1>📋 Detection History</h1>
      <p className={styles.subtitle}>Recent account analyses and risk scores.</p>

      {/* Summary chips */}
      {!loading && history.length > 0 && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryChip}>Total <strong>{history.length}</strong></div>
          <div className={styles.summaryChip}>Fake <strong style={{color:'var(--danger)'}}>{fakeCount}</strong></div>
          <div className={styles.summaryChip}>Genuine <strong style={{color:'var(--success)'}}>{genuineCount}</strong></div>
          <div className={styles.summaryChip}>Showing <strong>{displayed.length}</strong></div>
        </div>
      )}

      {/* Toolbar */}
      {!loading && history.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterBtns}>
            {['all', 'fake', 'genuine'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className={styles.exportBtn} onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : history.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyText}>No analyses yet. Run a detection from the Detect page.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('created_at')}>Date{sortArrow('created_at')}</th>
                <th onClick={() => handleSort('is_fake_prediction')}>Result{sortArrow('is_fake_prediction')}</th>
                <th onClick={() => handleSort('risk_score')}>Risk{sortArrow('risk_score')}</th>
                <th onClick={() => handleSort('fake_probability')}>Probability{sortArrow('fake_probability')}</th>
                <th onClick={() => handleSort('model_version')}>Model{sortArrow('model_version')}</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((row) => (
                <tr key={row.id}>
                  <td className={styles.mono}>{formatDate(row.created_at)}</td>
                  <td>
                    <span className={row.is_fake_prediction ? styles.badgeFake : styles.badgeGenuine}>
                      {row.is_fake_prediction ? '⚠ Fake' : '✓ Genuine'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.riskBar}>
                      <span className={styles.mono} style={{ minWidth: '36px' }}>{row.risk_score}%</span>
                      <div className={styles.riskTrack}>
                        <div
                          className={styles.riskFill}
                          style={{
                            width: `${row.risk_score}%`,
                            backgroundColor: getRiskColor(row.risk_score),
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={styles.mono}>{(row.fake_probability * 100).toFixed(1)}%</td>
                  <td className={styles.mono}>{row.model_version || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
