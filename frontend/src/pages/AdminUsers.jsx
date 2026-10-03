import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import UserTable from '../components/UserTable.jsx';
import useDebounce from '../hooks/useDebounce.js';
import { deleteUser, getUsers } from '../services/adminService.js';
import { getErrorMessage } from '../services/api.js';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ users: [], totalUsers: 0, totalNotes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUsers(debouncedSearch.trim())
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError('');
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load users.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name} (${user.email}) and all of their ${user.noteCount} notes? This cannot be undone.`)) return;
    try {
      await deleteUser(user._id);
      setData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u._id !== user._id),
        totalUsers: prev.totalUsers - 1,
        totalNotes: prev.totalNotes - user.noteCount,
      }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the user.'));
    }
  };

  return (
    <div className="app-shell">
      <Navbar admin />
      <main className="admin-page">
        <h1>Users</h1>
        <p className="muted">{data.totalUsers} users · {data.totalNotes} notes in total</p>
        <SearchBar value={search} onChange={setSearch} />
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? <p className="empty">Loading users…</p> : <UserTable users={data.users} onDelete={handleDelete} />}
      </main>
    </div>
  );
}
