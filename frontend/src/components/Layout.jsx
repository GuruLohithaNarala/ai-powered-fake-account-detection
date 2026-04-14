import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>🛡️</span>
          <div className={styles.brandName}>
            <span>FakeDetect</span>
            <span className={styles.brandSub}>AI Security</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.active : ''}>
            <span>📊</span><span>Dashboard</span>
          </NavLink>
          <NavLink to="/detect" className={({ isActive }) => isActive ? styles.active : ''}>
            <span>🔬</span><span>Detect</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? styles.active : ''}>
            <span>📋</span><span>History</span>
          </NavLink>
        </nav>

        <div className={styles.user}>
          <div className={styles.avatar}>{initials}</div>
          <span className={styles.email}>{user?.email}</span>
          <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
