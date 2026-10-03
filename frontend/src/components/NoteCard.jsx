import { formatUpdated } from '../utils/formatDate.js';

const preview = (text, max = 140) => {
  const flat = (text || '').replace(/\s+/g, ' ').trim();
  if (!flat) return 'No content yet';
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
};

export default function NoteCard({ note, onOpen, onDelete }) {
  return (
    <article className="note-card">
      <button type="button" className="note-card-body" onClick={() => onOpen(note._id)}>
        <h3>{note.title}</h3>
        <p>{preview(note.content)}</p>
        <div className="note-tags">
          {note.tags.map((tag) => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      </button>
      <div className="note-card-footer">
        <span className="note-date">Updated: {formatUpdated(note.updatedAt)}</span>
        <div className="note-actions">
          <button type="button" className="link-btn" onClick={() => onOpen(note._id)}>Edit</button>
          <button type="button" className="link-btn danger" onClick={() => onDelete(note)}>Delete</button>
        </div>
      </div>
    </article>
  );
}
