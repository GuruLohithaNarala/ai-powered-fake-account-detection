import { useState, useEffect } from 'react';
import styles from './AdminTables.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken()    { return localStorage.getItem('token'); }
function formatDate(d) { try { return d ? new Date(d).toLocaleString() : '—'; } catch { return '—'; } }

function getRiskColor(score) {
  if (score >= 70) return 'var(--danger)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--success)';
}

export default function AdminDetections() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [sortField, setSortField]   = useState('created_at');
  const [sortDir, setSortDir]       = useState('desc');

  useEffect(() => {
    fetch(API + '/api/admin/detections', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : { detections: [] }))
      .then((data) => setDetections(data.detections || []))
      .catch(() => setDetections([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };
  const arrow = (f) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const displayed = [...detections]
    .filter(d => {
      if (filter === 'fake'    && !d.is_fake_prediction) return false;
      if (filter === 'genuine' &&  d.is_fake_prediction) return false;
      if (search) {
        const s = search.toLowerCase();
        return (d.email || '').toLowerCase().includes(s) ||
               String(d.risk_score).includes(s) ||
               (d.model_version || '').toLowerCase().includes(s);
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

  const fakeCount = detections.filter(d => d.is_fake_prediction).length;

  return (
    <div className={styles.page}>
      <h1>🔬 Detections</h1>
      <p className={styles.subtitle}>All fake account detection results</p>

      {!loading && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryChip}>Total <strong>{detections.length}</strong></div>
          <div className={styles.summaryChip}>Fake <strong style={{color:'var(--danger)'}}>{fakeCount}</strong></div>
          <div className={styles.summaryChip}>Genuine <strong style={{color:'var(--success)'}}>{detections.length - fakeCount}</strong></div>
          <div className={styles.summaryChip}>Showing <strong>{displayed.length}</strong></div>
        </div>
      )}

      {!loading && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search by user, risk, model…"
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
                <th onClick={() => handleSort('email')}>User{arrow('email')}</th>
                <th onClick={() => handleSort('is_fake_prediction')}>Result{arrow('is_fake_prediction')}</th>
                <th onClick={() => handleSort('risk_score')}>Risk{arrow('risk_score')}</th>
                <th onClick={() => handleSort('fake_probability')}>Probability{arrow('fake_probability')}</th>
                <th onClick={() => handleSort('model_version')}>Model{arrow('model_version')}</th>
                <th onClick={() => handleSort('created_at')}>Date{arrow('created_at')}</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((d) => (
                <tr key={d.id}>
                  <td className={styles.mono}>{d.id}</td>
                  <td>{d.email || `User #${d.user_id}`}</td>
                  <td>
                    <span className={d.is_fake_prediction ? styles.badgeFake : styles.badgeGenuine}>
                      {d.is_fake_prediction ? '⚠ Fake' : '✓ Genuine'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.riskBar}>
                      <span className={styles.mono} style={{ minWidth: '36px' }}>{d.risk_score}%</span>
                      <div className={styles.riskTrack}>
                        <div className={styles.riskFill} style={{ width: `${d.risk_score}%`, backgroundColor: getRiskColor(d.risk_score) }} />
                      </div>
                    </div>
                  </td>
                  <td className={styles.mono}>{d.fake_probability != null ? (d.fake_probability * 100).toFixed(1) + '%' : '—'}</td>
                  <td className={styles.mono}>{d.model_version || '—'}</td>
                  <td className={styles.mono}>{formatDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
