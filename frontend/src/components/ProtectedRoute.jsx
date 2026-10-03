import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// role="user"       -> normal users only (super admins are sent to /admin)
// role="superadmin" -> super admins only (normal users are sent to /dashboard)
// The backend enforces the same rules; this only controls what the UI shows.
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'superadmin' && user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  if (role === 'user' && user.role === 'superadmin') return <Navigate to="/admin" replace />;

  return <Outlet />;
}
