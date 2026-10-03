# Study Helper

Multi-user notes app: **React (Vite, JavaScript) → Axios → Express → JWT auth → Mongoose → MongoDB**.
Normal users see only their own notes; a Super Admin manages all users and notes.

## Folder structure

```
study-helper/
├── backend/
│   ├── config/db.js                  MongoDB connection
│   ├── controllers/                  auth, note, admin logic
│   ├── middleware/                   authenticateUser, isSuperAdmin, error handling
│   ├── models/                       User, Note (Mongoose)
│   ├── routes/                       auth, note, admin routes
│   ├── scripts/createSuperAdmin.js   controlled super admin setup
│   ├── utils/                        ApiError, asyncHandler, tag normalisation
│   ├── app.js  server.js  .env.example  package.json
└── frontend/
    ├── src/components/               Navbar, Sidebar, NoteCard, NoteEditor, SearchBar, TagFilter, ProtectedRoute, UserTable
    ├── src/pages/                    Login, Register, Dashboard, NoteEditorPage, Admin*
    ├── src/context/AuthContext.jsx   session state
    ├── src/services/                 api (single Axios instance), authService, noteService, adminService
    ├── src/hooks/useDebounce.js
    ├── src/styles/                   global, auth, dashboard, editor, admin CSS
    └── .env.example  package.json  index.html
```

## Setup

Requirements: Node.js 18+ and a running MongoDB (local or Atlas).

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env     # then edit MONGODB_URI and set a long random JWT_SECRET
npm run dev              # http://localhost:5000
```
Environment variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (default `http://localhost:5173`),
optional `JWT_EXPIRES_IN` and `COOKIE_SAME_SITE`.

### 2. Create the Super Admin
```bash
cd backend
npm run create-superadmin
```
You will be asked for name, email and password. If the email already belongs to a normal user, you can promote it.
Public registration can never create a super admin.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

## API

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register, /login, /logout | public |
| GET | /api/auth/me | logged in |
| GET | /api/notes?search=&tag= | own notes only |
| GET | /api/notes/tags | own tags (used by the tag filter) |
| GET / PATCH / DELETE | /api/notes/:id | own note only (404 otherwise) |
| POST | /api/notes | logged in; owner = JWT user |
| GET | /api/admin/users?search= | super admin |
| GET | /api/admin/users/:id, /api/admin/users/:id/notes | super admin |
| DELETE | /api/admin/users/:id (also deletes their notes), /api/admin/notes/:id | super admin |

Responses: `{ "success": true, "data": {...} }` or `{ "success": false, "message": "..." }`.

## How the key requirements are met

- **Authentication**: bcrypt-hashed passwords (`select: false`, stripped in `toJSON`); JWT stored in an HTTP-only cookie (Bearer header also accepted). The user and role are loaded from the database on every request.
- **Data isolation**: every note query includes `user: req.user._id` (`Note.find({ user })`, `findOne({ _id, user })`, `findOneAndUpdate({ _id, user })`, `findOneAndDelete({ _id, user })`). The `user` field in a request body is ignored.
- **Roles**: registration always sets `role: "user"`. `/api/admin/*` uses `authenticateUser` then `isSuperAdmin`. Super admin accounts cannot be deleted through the API.
- **Tags**: trimmed, lower-cased, `#` removed, de-duplicated, max 20 per note.
- **Search / filter**: case-insensitive, regex-escaped search on title and content, combined with tag filter in one query. Indexes: `User.email` (unique), `Note {user, updatedAt}`, `Note {user, tags}`.
- **Auto-save**: 1.5 s debounce, status Idle / Typing / Saving / Saved / Error. Only one request is in flight; edits made during a save are queued and sent afterwards, so older responses never overwrite newer text. A new note is created on its first save, then updated. Failed saves keep the changes and can be retried with "Save now".

## Manual test checklist

1. Register two users (A, B). Create notes as A; log in as B and confirm none are visible.
2. As B, open A's note URL (`/notes/<A's id>`) and call `GET/PATCH/DELETE /api/notes/<A's id>`: all return 404.
3. Try `POST /api/auth/register` with `"role":"superadmin"`: the account is still `user`.
4. As a normal user open `/admin`: redirected to `/dashboard`; `GET /api/admin/users` returns 403.
5. Log in as super admin: view users, search, open a user, delete a note, delete a user (their notes are removed too).
6. Type in the editor: one request about 1.5 s after you stop typing; status moves Typing… → Saving… → ✓ Saved. Stop the backend to see the Error state.
7. Search `hooks` with tag `react`: results must match both.
8. Resize to phone width: the sidebar becomes a slide-in menu.
