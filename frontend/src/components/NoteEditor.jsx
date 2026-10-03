import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce.js';
import { createNote, deleteNote, getTags, updateNote } from '../services/noteService.js';
import { getErrorMessage } from '../services/api.js';

const AUTOSAVE_DELAY_MS = 1500;
const STATUS_LABEL = {
  idle: '',
  typing: 'Typing…',
  saving: 'Saving…',
  saved: '✓ Saved',
  error: 'Error: not saved',
};

const normalizeTag = (value) => value.trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase();
const isBlank = (d) => !d.title.trim() && !d.content.trim() && d.tags.length === 0;

/*
 * Auto-saving editor.
 *  - Edits update `draft` and mark it dirty; the debounced draft triggers a save 1.5s after typing stops.
 *  - Only ONE request is in flight at a time. If another save is requested meanwhile, it is queued and runs
 *    afterwards with the latest content, so older responses can never overwrite newer text.
 *  - The first save of a new note creates it (POST); afterwards the note is updated (PATCH).
 */
export default function NoteEditor({ initialNote, onCreated }) {
  const navigate = useNavigate();

  const [draft, setDraft] = useState({
    title: initialNote?.title === 'Untitled' ? '' : initialNote?.title || '',
    content: initialNote?.content || '',
    tags: initialNote?.tags || [],
  });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [knownTags, setKnownTags] = useState([]);

  const latest = useRef(draft);
  const noteId = useRef(initialNote?._id || null);
  const dirty = useRef(false);
  const inFlight = useRef(null);
  const queued = useRef(false);
  const onCreatedRef = useRef(onCreated);
  onCreatedRef.current = onCreated;

  const debouncedDraft = useDebounce(draft, AUTOSAVE_DELAY_MS);

  useEffect(() => {
    getTags().then((tags) => setKnownTags(tags.map((t) => t.name))).catch(() => {});
  }, []);

  // Saves the latest draft. Resolves to true on success, false on failure.
  const persist = useCallback(() => {
    if (inFlight.current) {
      queued.current = true;
      return inFlight.current;
    }

    const run = (async () => {
      await null; // guarantees inFlight is assigned before the body continues
      let ok = true;
      try {
        do {
          queued.current = false;
          const snapshot = { ...latest.current };
          if (!noteId.current && isBlank(snapshot)) {
            dirty.current = false;
            setStatus('idle');
            return true;
          }
          setStatus('saving');
          dirty.current = false; // edits made during the request set this again
          if (!noteId.current) {
            const created = await createNote(snapshot);
            noteId.current = created._id;
            onCreatedRef.current?.(created._id);
          } else {
            await updateNote(noteId.current, snapshot);
          }
        } while (queued.current);
        setErrorMessage('');
        setStatus(dirty.current ? 'typing' : 'saved');
      } catch (err) {
        ok = false;
        dirty.current = true; // keep the changes so they can be retried
        setErrorMessage(getErrorMessage(err, 'Could not save your note.'));
        setStatus('error');
      } finally {
        inFlight.current = null;
      }
      return ok;
    })();

    inFlight.current = run;
    return run;
  }, []);

  // Fires once the user has stopped typing for AUTOSAVE_DELAY_MS.
  useEffect(() => {
    if (dirty.current) persist();
  }, [debouncedDraft, persist]);

  // Best-effort save of unsaved changes when leaving the editor.
  useEffect(
    () => () => {
      if (dirty.current) persist();
    },
    [persist]
  );

  const change = (partial) => {
    latest.current = { ...latest.current, ...partial };
    dirty.current = true;
    setDraft(latest.current);
    setStatus('typing');
  };

  const addTags = (raw) => {
    const incoming = raw.split(',').map(normalizeTag).filter(Boolean);
    if (incoming.length === 0) return;
    const merged = [...latest.current.tags];
    incoming.forEach((tag) => {
      if (!merged.includes(tag)) merged.push(tag);
    });
    if (merged.length !== latest.current.tags.length) change({ tags: merged });
    setTagInput('');
  };

  const removeTag = (tag) => change({ tags: latest.current.tags.filter((t) => t !== tag) });

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTags(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && latest.current.tags.length) {
      removeTag(latest.current.tags[latest.current.tags.length - 1]);
    }
  };

  const handleBack = async () => {
    if (tagInput.trim()) addTags(tagInput);
    if (dirty.current || inFlight.current) {
      const ok = await persist();
      if (!ok) return; // stay on the page so the user can see the error
    }
    navigate('/dashboard');
  };

  const handleSave = async () => {
    if (tagInput.trim()) addTags(tagInput);
    await persist();
  };

  const handleDelete = async () => {
    if (!noteId.current) {
      dirty.current = false;
      navigate('/dashboard');
      return;
    }
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      dirty.current = false;
      if (inFlight.current) await inFlight.current;
      await deleteNote(noteId.current);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Could not delete the note.'));
      setStatus('error');
    }
  };

  const suggestions = knownTags.filter((t) => !draft.tags.includes(t));

  return (
    <div className="editor">
      <div className="editor-toolbar">
        <button type="button" className="btn btn-ghost" onClick={handleBack}>← Back</button>
        <span className={`save-status save-${status}`} role="status" aria-live="polite">
          {STATUS_LABEL[status]}
        </span>
        <div className="editor-toolbar-actions">
          <button type="button" className="btn btn-ghost" onClick={handleSave} disabled={status === 'saving'}>
            Save now
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      {status === 'error' && <div className="alert alert-error">{errorMessage} Your changes are kept; edit again or press “Save now” to retry.</div>}

      <input
        className="editor-title"
        type="text"
        placeholder="Title"
        maxLength={200}
        value={draft.title}
        onChange={(e) => change({ title: e.target.value })}
        aria-label="Note title"
        autoFocus={!initialNote}
      />

      <textarea
        className="editor-content"
        placeholder="Start writing…"
        value={draft.content}
        onChange={(e) => change({ content: e.target.value })}
        aria-label="Note content"
      />

      <div className="editor-tags">
        <label htmlFor="tag-input" className="editor-label">Tags</label>
        <div className="tag-input-row">
          {draft.tags.map((tag) => (
            <span key={tag} className="tag tag-removable">
              #{tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>×</button>
            </span>
          ))}
          <input
            id="tag-input"
            className="tag-input"
            type="text"
            list="tag-suggestions"
            placeholder="Add a tag and press Enter"
            maxLength={30}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => addTags(tagInput)}
          />
          <datalist id="tag-suggestions">
            {suggestions.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
      </div>
    </div>
  );
}
