import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Top bar. `onMenuClick` shows the mobile sidebar toggle; `admin` shows admin links and logout.
export default function Navbar({ onMenuClick, admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      {onMenuClick && (
        <button type="button" className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Open menu">
          ☰
        </button>
      )}
      <Link to={admin ? '/admin' : '/dashboard'} className="brand">
        Study Helper{admin && <span className="brand-badge">Admin</span>}
      </Link>

      {admin && (
        <nav className="navbar-links">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
        </nav>
      )}

      <div className="navbar-right">
        <span className="navbar-user">{user?.name}</span>
        {admin && (
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        )}
      </div>
    </header>
  );
}
