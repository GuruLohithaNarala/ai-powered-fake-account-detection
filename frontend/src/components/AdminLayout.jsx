import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  const navLinks = [
    { to: '/admin/dashboard',      icon: '📊', label: 'Dashboard' },
    { to: '/admin/users',          icon: '👥', label: 'Users' },
    { to: '/admin/detections',     icon: '🔬', label: 'Detections' },
    { to: '/admin/audit',          icon: '📜', label: 'Audit Logs' },
    { to: '/admin/login-attempts', icon: '🔐', label: 'Login Attempts' },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚙️</span>
          <div className={styles.brandName}>
            <span className={styles.brandText}>Admin Portal</span>
            <span className={styles.brandSub}>FakeDetect System</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navLinks.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? styles.active : ''}>
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{initials}</div>
            <span className={styles.email}>{user?.email}</span>
          </div>
          <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
