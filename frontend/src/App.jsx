import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NoteEditorPage from './pages/NoteEditorPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminUserDetails from './pages/AdminUserDetails.jsx';

// Sends "/" and unknown URLs to the right home for the current role.
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'superadmin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute role="user" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* One route serves both /notes/new and /notes/:id so the editor is not remounted after the first save */}
        <Route path="/notes/:id" element={<NoteEditorPage />} />
      </Route>

      <Route element={<ProtectedRoute role="superadmin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:id" element={<AdminUserDetails />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
