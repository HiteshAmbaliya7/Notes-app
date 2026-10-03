import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import NoteEditor from '../components/NoteEditor.jsx';
import { getNote } from '../services/noteService.js';
import { getErrorMessage } from '../services/api.js';

// Handles both /notes/new and /notes/:id.
export default function NoteEditorPage() {
  const { id: routeId } = useParams();
  const id = routeId === 'new' ? undefined : routeId; // undefined means a brand-new note
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const createdIdRef = useRef(null); // id of a note created by the editor in this visit

  useEffect(() => {
    if (!id) {
      setNote(null);
      setLoading(false);
      return undefined;
    }
    // The editor just created this note; it already holds the latest content, so don't refetch.
    if (createdIdRef.current === id) return undefined;

    let cancelled = false;
    setLoading(true);
    setError('');
    getNote(id)
      .then((n) => !cancelled && setNote(n))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load this note.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // After the first auto-save of a new note, move the URL to /notes/:id without remounting the editor.
  const handleCreated = (newId) => {
    createdIdRef.current = newId;
    navigate(`/notes/${newId}`, { replace: true });
  };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="editor-page">
        {loading && <p className="empty">Loading note…</p>}
        {!loading && error && (
          <div className="alert alert-error">
            {error} <Link to="/dashboard">Back to dashboard</Link>
          </div>
        )}
        {!loading && !error && (
          <NoteEditor key={note?._id || 'new'} initialNote={note} onCreated={handleCreated} />
        )}
      </main>
    </div>
  );
}
