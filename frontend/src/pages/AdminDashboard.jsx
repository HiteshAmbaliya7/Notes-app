import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import UserTable from '../components/UserTable.jsx';
import { getUsers } from '../services/adminService.js';
import { getErrorMessage } from '../services/api.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Could not load admin data.')));
  }, []);

  return (
    <div className="app-shell">
      <Navbar admin />
      <main className="admin-page">
        <h1>Admin dashboard</h1>
        {error && <div className="alert alert-error">{error}</div>}
        {!data && !error && <p className="empty">Loading…</p>}
        {data && (
          <>
            <div className="stats">
              <div className="stat"><span className="stat-value">{data.totalUsers}</span><span className="stat-label">Users</span></div>
              <div className="stat"><span className="stat-value">{data.totalNotes}</span><span className="stat-label">Notes</span></div>
            </div>
            <div className="section-head">
              <h2>Newest users</h2>
              <Link to="/admin/users" className="btn btn-ghost">Manage all users</Link>
            </div>
            <UserTable users={data.users.slice(0, 5)} />
          </>
        )}
      </main>
    </div>
  );
}
