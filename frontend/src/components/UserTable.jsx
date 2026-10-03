import { Link } from 'react-router-dom';
import { formatDate } from '../utils/formatDate.js';

export default function UserTable({ users, onDelete }) {
  if (users.length === 0) return <p className="empty">No users found.</p>;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Notes</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td><span className={`role role-${u.role}`}>{u.role === 'superadmin' ? 'Super admin' : 'User'}</span></td>
              <td>{u.noteCount}</td>
              <td>{formatDate(u.createdAt)}</td>
              <td className="table-actions">
                <Link to={`/admin/users/${u._id}`} className="link-btn">View</Link>
                {onDelete && u.role !== 'superadmin' && (
                  <button type="button" className="link-btn danger" onClick={() => onDelete(u)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
