import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import TagFilter from '../components/TagFilter.jsx';
import NoteCard from '../components/NoteCard.jsx';
import useDebounce from '../hooks/useDebounce.js';
import { deleteNote, getNotes, getTags } from '../services/noteService.js';
import { getErrorMessage } from '../services/api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  // Search and tag filter are combined in one request: /notes?search=...&tag=...
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNotes({ search: debouncedSearch.trim(), tag })
      .then((data) => {
        if (cancelled) return;
        setNotes(data);
        setError('');
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load your notes.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, tag]);

  const loadTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
      return data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleDelete = async (note) => {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    try {
      await deleteNote(note._id);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
      const remaining = await loadTags();
      if (tag && !remaining.some((t) => t.name === tag)) setTag('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the note.'));
    }
  };

  const resetFilters = () => {
    setSearch('');
    setTag('');
  };

  const filtering = Boolean(debouncedSearch.trim() || tag);

  return (
    <div className="app-shell">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onReset={resetFilters} />
        <main className="main-content">
          <div className="dashboard-head">
            <h1>My notes</h1>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/notes/new')}>
              + New note
            </button>
          </div>

          <SearchBar value={search} onChange={setSearch} />
          <TagFilter tags={tags} active={tag} onSelect={setTag} />

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <p className="empty">Loading notes…</p>
          ) : notes.length === 0 ? (
            <p className="empty">
              {filtering ? 'No notes match your search or tag.' : 'You have no notes yet. Select “New note” to write your first one.'}
            </p>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <NoteCard key={note._id} note={note} onOpen={(id) => navigate(`/notes/${id}`)} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
