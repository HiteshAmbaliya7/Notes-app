import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { deleteNote, deleteUser, getUser, getUserNotes } from '../services/adminService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate, formatUpdated } from '../utils/formatDate.js';

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getUser(id), getUserNotes(id)])
      .then(([u, n]) => {
        if (cancelled) return;
        setUser(u);
        setNotes(n);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load this user.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDeleteNote = async (note) => {
    if (!window.confirm(`Delete the note "${note.title}"?`)) return;
    try {
      await deleteNote(note._id);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
      setUser((prev) => ({ ...prev, noteCount: prev.noteCount - 1 }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the note.'));
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`Delete ${user.name} and all of their notes? This cannot be undone.`)) return;
    try {
      await deleteUser(user._id);
      navigate('/admin/users', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the user.'));
    }
  };

  return (
    <div className="app-shell">
      <Navbar admin />
      <main className="admin-page">
        <Link to="/admin/users" className="link-btn">← All users</Link>
        {loading && <p className="empty">Loading…</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {user && (
          <>
            <div className="section-head">
              <div>
                <h1>{user.name}</h1>
                <p className="muted">{user.email}</p>
              </div>
              {user.role !== 'superadmin' && (
                <button type="button" className="btn btn-danger" onClick={handleDeleteUser}>Delete user</button>
              )}
            </div>

            <dl className="details">
              <div><dt>Role</dt><dd>{user.role === 'superadmin' ? 'Super admin' : 'User'}</dd></div>
              <div><dt>Joined</dt><dd>{formatDate(user.createdAt)}</dd></div>
              <div><dt>Notes</dt><dd>{user.noteCount}</dd></div>
            </dl>

            <h2>Notes</h2>
            {notes.length === 0 ? (
              <p className="empty">This user has no notes.</p>
            ) : (
              <ul className="admin-notes">
                {notes.map((note) => (
                  <li key={note._id} className="admin-note">
                    <div className="admin-note-head">
                      <div>
                        <h3>{note.title}</h3>
                        <span className="note-date">Updated: {formatUpdated(note.updatedAt)}</span>
                      </div>
                      <button type="button" className="link-btn danger" onClick={() => handleDeleteNote(note)}>Delete</button>
                    </div>
                    <div className="note-tags">
                      {note.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                    </div>
                    <details>
                      <summary>Show content</summary>
                      <pre className="admin-note-content">{note.content || 'No content'}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
