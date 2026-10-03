import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ open, onClose, onReset }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <Link to="/dashboard" onClick={() => { onReset?.(); onClose?.(); }}>Dashboard</Link>
          <Link to="/dashboard" onClick={() => { onReset?.(); onClose?.(); }}>Notes</Link>
          <a href="#tags" onClick={onClose}>Tags</a>
        </nav>
        <button type="button" className="sidebar-logout" onClick={handleLogout}>Logout</button>
      </aside>
    </>
  );
}
