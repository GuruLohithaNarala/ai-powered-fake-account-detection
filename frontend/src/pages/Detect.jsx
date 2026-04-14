import { useState } from 'react';
import styles from './Detect.module.css';

const API = import.meta.env.VITE_API_URL || '';
function getToken() { return localStorage.getItem('token'); }

const FIELDS = [
  { key: 'account_age_days',  label: 'Account Age',      unit: 'days',  min: 0, max: 3650, step: 1,    default: 30   },
  { key: 'followers_count',   label: 'Followers',         unit: '',      min: 0, max: 1000000, step: 1, default: 100  },
  { key: 'following_count',   label: 'Following',         unit: '',      min: 0, max: 1000000, step: 1, default: 200  },
  { key: 'post_count',        label: 'Post Count',        unit: '',      min: 0, max: 100000, step: 1,  default: 50   },
  { key: 'posts_per_week',    label: 'Posts / Week',      unit: '/wk',   min: 0, max: 100,   step: 0.1, default: 2   },
  { key: 'username_length',   label: 'Username Length',   unit: 'chars', min: 1, max: 50,    step: 1,   default: 10  },
  { key: 'bio_length',        label: 'Bio Length',        unit: 'chars', min: 0, max: 2200,  step: 1,   default: 80  },
  { key: 'engagement_rate',   label: 'Engagement Rate',   unit: '',      min: 0, max: 1,     step: 0.01, default: 0.05 },
];

/** Toggle switch component */
function Toggle({ checked, onChange, label }) {
  return (
    <label className={styles.toggle}>
      <input className={styles.toggleInput} type="checkbox" checked={checked} onChange={onChange} />
      <span className={`${styles.toggleTrack} ${checked ? styles.on : ''}`}>
        <span className={styles.toggleThumb} />
      </span>
      {label}
    </label>
  );
}

export default function Detect() {
  const [form, setForm] = useState(() =>
    Object.fromEntries([
      ...FIELDS.map(f => [f.key, f.default]),
      ['has_profile_picture', true],
      ['has_bio', true],
    ])
  );
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    const payload = {
      ...form,
      has_profile_picture: !!form.has_profile_picture,
      has_bio: !!form.has_bio,
    };
    try {
      const res  = await fetch(API + '/api/detection/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Prediction failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const riskColor = result
    ? result.risk_score > 70 ? 'var(--danger)'
    : result.risk_score > 40 ? 'var(--warning)'
    : 'var(--success)'
    : 'var(--accent)';

  return (
    <div className={styles.page}>
      <h1>🔬 Analyze Account</h1>
      <p className={styles.subtitle}>
        Adjust the sliders and toggles below. The ML model uses behavioral and
        consistency signals to estimate fake-account risk.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          {FIELDS.map(({ key, label, unit, min, max, step }) => (
            <div key={key} className={styles.sliderLabel}>
              <div className={styles.sliderWrap}>
                <div className={styles.sliderHeader}>
                  <span>{label}</span>
                  <span className={styles.sliderValue}>
                    {form[key]}{unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={min} max={max} step={step}
                  value={form[key]}
                  onChange={(e) => update(key, +e.target.value)}
                />
                {/* Also allow number input */}
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => update(key, +e.target.value)}
                  />
                  {unit && <span className={styles.inputUnit}>{unit}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.checkboxes}>
          <Toggle
            checked={form.has_profile_picture}
            onChange={(e) => update('has_profile_picture', e.target.checked)}
            label="Has profile picture"
          />
          <Toggle
            checked={form.has_bio}
            onChange={(e) => update('has_bio', e.target.checked)}
            label="Has bio"
          />
        </div>

        {error && <div className={styles.error}>⚠ {error}</div>}

        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? '⏳ Analyzing…' : '→ Run Detection'}
        </button>
      </form>

      {result && (
        <div className={`${styles.result} ${result.is_fake ? styles.fake : styles.genuine}`}>
          <span className={styles.resultIcon}>{result.is_fake ? '🚨' : '✅'}</span>
          <h3>{result.is_fake ? 'Suspicious / Fake Account' : 'Likely Genuine Account'}</h3>

          <p className={styles.risk}>Risk score: <strong>{result.risk_score}%</strong></p>
          <div className={styles.riskGauge}>
            <div
              className={styles.riskFill}
              style={{ width: `${result.risk_score}%`, background: riskColor }}
            />
          </div>

          <p className={styles.message}>{result.message}</p>
          <p className={styles.meta}>Model: {result.model_version}</p>
        </div>
      )}
    </div>
  );
}
