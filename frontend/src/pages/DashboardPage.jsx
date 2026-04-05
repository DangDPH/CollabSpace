/**
 * pages/DashboardPage.jsx
 * Miro-like dashboard: sidebar nav + board grid/list + per-board options menu.
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchBoards, createBoard as apiCreateBoard, deleteBoard as apiDeleteBoard } from '../api/boards';
import client from '../api/client';
import '../dashboard.css';

/* ── Thumbnail colour palette ── */
const BOARD_COLORS = [
  '#74C0FC', '#a78bfa', '#6ee7b7', '#fcd34d',
  '#f9a8d4', '#fd8a5a', '#86efac', '#c4b5fd',
];

function boardGradient(color) {
  return `linear-gradient(135deg, ${color}33 0%, ${color}66 100%)`;
}

const DEFAULT_BOARDS = [
  { name: 'Project Alpha',  color: '#74C0FC', starred: true,  updated: 'Today'      },
  { name: 'Design Sprint',  color: '#a78bfa', starred: false, updated: 'Yesterday'  },
  { name: 'Team Retro',     color: '#6ee7b7', starred: true,  updated: '2 days ago' },
  { name: 'Roadmap 2025',   color: '#fcd34d', starred: false, updated: '5 days ago' },
];

/* ══════════════════════════════════════════
   Icons
══════════════════════════════════════════ */
const HomeIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const ClockIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const StarIcon   = ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const PlusIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const GridIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const ListIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const LogOutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const BrandIcon  = () => <svg viewBox="0 0 24 24" fill="none"><path d="M4 6L8.5 18L12 10L15.5 18L20 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const OpenIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;

/* Options menu icons */
const DotsIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5"  cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>;
const ShareIcon    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const TrashIcon    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const CopyIcon     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CheckIcon    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const KeyIcon      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const WarnIcon     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

/* Board mini art */
function BoardArt({ color }) {
  return (
    <svg width="100" height="72" viewBox="0 0 100 72" fill="none">
      <rect x="8"  y="8"  width="36" height="24" rx="4" fill={color} fillOpacity="0.35"/>
      <rect x="56" y="8"  width="36" height="14" rx="4" fill={color} fillOpacity="0.5"/>
      <rect x="56" y="28" width="36" height="14" rx="4" fill={color} fillOpacity="0.25"/>
      <rect x="8"  y="40" width="20" height="20" rx="4" fill={color} fillOpacity="0.5"/>
      <rect x="34" y="40" width="60" height="8"  rx="4" fill={color} fillOpacity="0.2"/>
      <rect x="34" y="52" width="40" height="8"  rx="4" fill={color} fillOpacity="0.2"/>
    </svg>
  );
}

/* ══════════════════════════════════════════
   Board Options Dropdown
══════════════════════════════════════════ */
function BoardOptionsMenu({ board, onShare, onDownload, onRemove }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handle = (fn) => (e) => {
    e.stopPropagation();
    setOpen(false);
    fn(board);
  };

  return (
    <div className="board-options-wrap" ref={wrapRef}>
      <button
        id={`options-btn-${board.id}`}
        className={`board-options-btn ${open ? 'open' : ''}`}
        title="Options"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <DotsIcon />
      </button>

      {open && (
        <div className="board-dropdown">
          <button
            id={`share-btn-${board.id}`}
            className="board-dropdown-item"
            onClick={handle(onShare)}
          >
            <ShareIcon /> Share
          </button>
          <button
            id={`download-btn-${board.id}`}
            className="board-dropdown-item"
            onClick={handle(onDownload)}
          >
            <DownloadIcon /> Download
          </button>
          <div className="board-dropdown-sep" />
          <button
            id={`remove-btn-${board.id}`}
            className="board-dropdown-item danger"
            onClick={handle(onRemove)}
          >
            <TrashIcon /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Share Modal
══════════════════════════════════════════ */
function ShareModal({ board, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/board/${board.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Share &ldquo;{board.name}&rdquo;</h2>
        <p className="modal-subtitle">Copy the link below and send it to your collaborators.</p>

        <div className="share-url-row">
          <input
            id="share-url-input"
            className="share-url-input"
            readOnly
            value={shareUrl}
            onFocus={e => e.target.select()}
          />
          <button
            id="copy-link-btn"
            className={`btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>

        <div className="modal-actions">
          <button id="share-modal-close" className="btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Confirm Remove Modal
══════════════════════════════════════════ */
function ConfirmRemoveModal({ board, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal confirm-modal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ color: '#dc2626' }}><WarnIcon /></span>
          <h2 className="modal-title" style={{ margin: 0 }}>Remove board?</h2>
        </div>
        <p className="modal-subtitle">
          &ldquo;{board.name}&rdquo; will be permanently deleted. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button id="cancel-remove-btn" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button id="confirm-remove-btn" className="btn-danger" onClick={() => { onConfirm(board.id); onClose(); }}>
            Delete board
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Reset Password Modal
══════════════════════════════════════════ */

/* Eye icons for password reveal */
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* Reusable password input with reveal toggle */
function PasswordField({ placeholder, value, onChange, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="modal-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        autoFocus={autoFocus}
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 12, top: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', padding: 0, display: 'flex',
        }}
        tabIndex={-1}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function ResetPasswordModal({ onClose }) {
  const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.current.trim()) return setError('Current password is required.');
    if (form.next.length < 6)  return setError('New password must be at least 6 characters.');
    if (form.next !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await client.patch('/api/v1/users/me/password', {
        current_password: form.current,
        new_password: form.next,
      });
      setSuccess('Password updated successfully!');
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Reset Password</h2>
        <p className="modal-subtitle">Enter your current password and choose a new one.</p>
        {error   && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', fontSize: 13, marginBottom: 8 }}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <PasswordField
            placeholder="Current password"
            value={form.current}
            onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
            autoFocus
          />
          <PasswordField
            placeholder="New password (min 6 chars)"
            value={form.next}
            onChange={e => setForm(f => ({ ...f, next: e.target.value }))}
          />
          <PasswordField
            placeholder="Confirm new password"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
          />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: 'auto', marginTop: 0, padding: '9px 20px' }}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Create Board Modal
══════════════════════════════════════════ */
function CreateBoardModal({ onClose, onCreate }) {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), color });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Create a new board</h2>
        <p className="modal-subtitle">Give your workspace a name and a colour.</p>
        <input
          id="new-board-name-input"
          className="modal-input"
          placeholder="Board name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />
        <div className="color-swatches">
          {BOARD_COLORS.map(c => (
            <div
              key={c}
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="modal-actions">
          <button id="cancel-create-board" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            id="confirm-create-board"
            className="btn-primary"
            style={{ width: 'auto', marginTop: 0, padding: '9px 20px' }}
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create Board
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main DashboardPage
══════════════════════════════════════════ */
export default function DashboardPage() {
  const auth     = useAuth();
  const user     = auth?.user ?? null;
  const logout   = auth?.logout ?? (() => Promise.resolve());
  const navigate = useNavigate();

  const [section, setSection]       = useState('home');
  const [boards, setBoards]         = useState([]);
  const [search, setSearch]         = useState('');
  const [viewMode, setViewMode]     = useState('grid');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading]       = useState(true);

  /* Modal state */
  const [shareBoard,     setShareBoard]     = useState(null);
  const [removeBoard,    setRemoveBoard]    = useState(null);
  const [showResetPw,    setShowResetPw]    = useState(false);
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  /* ── Load boards from backend on mount ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchBoards();
        if (cancelled) return;

        if (data.length > 0) {
          // Map backend docs to our frontend shape
          const starredCache = JSON.parse(localStorage.getItem('starred_boards') || '{}');
          const mapped = data.map((b, i) => ({
            id: b.id,
            name: b.name,
            color: b.color || BOARD_COLORS[i % BOARD_COLORS.length],
            starred: starredCache[b.id] || false,
            updated: b.updated || 'Recently',
          }));
          setBoards(mapped);
        } else {
          // First-time user: seed default boards into the backend
          const seeded = [];
          for (const def of DEFAULT_BOARDS) {
            try {
              const created = await apiCreateBoard({ name: def.name, color: def.color });
              seeded.push({ ...created, color: def.color, starred: def.starred, updated: def.updated });
            } catch (_) { /* skip if backend unavailable */ }
          }
          if (!cancelled) setBoards(seeded);
        }
      } catch (err) {
        console.error('Failed to load boards:', err);
        // Fallback: use defaults with temporary ids
        if (!cancelled) setBoards(DEFAULT_BOARDS.map((b, i) => ({ ...b, id: `temp-${i}` })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Persist color and starred state to localStorage ── */
  useEffect(() => {
    if (boards.length === 0) return;
    const colorCache = {};
    const starredCache = {};
    boards.forEach(b => {
      colorCache[b.id] = b.color;
      if (b.starred) starredCache[b.id] = true;
    });
    localStorage.setItem('board_colors', JSON.stringify(colorCache));
    localStorage.setItem('starred_boards', JSON.stringify(starredCache));
  }, [boards]);

  /* Filter boards */
  const visible = useMemo(() => {
    let list = boards;
    if (section === 'starred') list = list.filter(b => b.starred);
    if (section === 'recent')  list = [...list].reverse();
    if (search.trim())
      list = list.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [boards, section, search]);

  /* Handlers */
  const handleCreate = async ({ name, color }) => {
    try {
      const newBoard = await apiCreateBoard({ name, color });
      setBoards(prev => [{ ...newBoard, color, starred: false, updated: 'Just now' }, ...prev]);
    } catch (err) {
      console.error('Failed to create board:', err);
      // Fallback: add locally with temp id
      setBoards(prev => [{ id: `temp-${Date.now()}`, name, color, starred: false, updated: 'Just now' }, ...prev]);
    }
    setSection('home');
  };

  const toggleStar = (id, e) => {
    e.stopPropagation();
    setBoards(prev => prev.map(b => b.id === id ? { ...b, starred: !b.starred } : b));
  };

  const handleDownload = useCallback((board) => {
    /* Creates a JSON snapshot of board data and triggers download */
    const data = JSON.stringify({ id: board.id, name: board.name, color: board.color, canvas: [], text: '' }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${board.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRemoveConfirm = async (id) => {
    setBoards(prev => prev.filter(b => b.id !== id));
    try {
      await apiDeleteBoard(id);
    } catch (err) {
      console.error('Failed to delete board from backend:', err);
    }
  };

  const openBoard  = (id) => navigate(`/board/${id}`);
  const handleLogout = async () => {
    try { await logout(); } catch (_) {}
    navigate('/auth');
  };

  const sectionLabel = { home: 'All Boards', recent: 'Recent', starred: 'Starred' }[section];
  const initials = (user?.username || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-shell">
      {/* ═══ SIDEBAR ═══════════════════════════════ */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><BrandIcon /></div>
          <span className="sidebar-brand-name">CollabSpace</span>
        </div>

        <div className="sidebar-user" ref={userMenuRef} style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => setShowUserMenu(o => !o)}
        >
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.username || 'My Workspace'}</div>
          </div>
          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: '110%', left: 0,
              background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              padding: '6px 0', minWidth: 180, zIndex: 200,
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); setShowResetPw(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', background: 'none', border: 'none', padding: '9px 16px',
                  cursor: 'pointer', fontSize: 14, color: '#334155',
                }}
              >
                <span style={{ width: 16, height: 16, display: 'flex' }}><KeyIcon /></span>
                Reset Password
              </button>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <button id="nav-home"    className={`sidebar-nav-item ${section === 'home'    ? 'active' : ''}`} onClick={() => setSection('home')}><HomeIcon />  Home</button>
          <button id="nav-recent"  className={`sidebar-nav-item ${section === 'recent'  ? 'active' : ''}`} onClick={() => setSection('recent')}><ClockIcon /> Recent</button>
          <button id="nav-starred" className={`sidebar-nav-item ${section === 'starred' ? 'active' : ''}`} onClick={() => setSection('starred')}><StarIcon />  Starred</button>
        </nav>

        <div className="sidebar-bottom">
          <button id="sidebar-logout" className="sidebar-logout" onClick={handleLogout}><LogOutIcon /> Sign out</button>
        </div>
      </aside>

      {/* ═══ MAIN ═══════════════════════════════════ */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <span className="topbar-title">{sectionLabel}</span>

          <div className="search-bar">
            <span className="search-icon"><SearchIcon /></span>
            <input
              id="board-search-input"
              className="search-input"
              placeholder="Search boards…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <span className="topbar-spacer" />

          <div className="view-toggle">
            <button id="view-grid-btn" className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view"><GridIcon /></button>
            <button id="view-list-btn" className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view"><ListIcon /></button>
          </div>

          <button id="create-board-btn" className="btn-create" onClick={() => setShowCreate(true)}>
            <PlusIcon /> New board
          </button>
        </header>

        <main className="dashboard-content">
          <div className="section-header">
            <span className="section-title">
              {sectionLabel}
              <span className="section-count" style={{ marginLeft: 8 }}>
                {visible.length} {visible.length === 1 ? 'board' : 'boards'}
              </span>
            </span>
          </div>

          {/* ── GRID VIEW ── */}
          {viewMode === 'grid' && (
            <div className="board-grid">
              {/* Create card */}
              <div id="grid-create-card" className="board-card create-card" onClick={() => setShowCreate(true)}>
                <div className="board-thumbnail">
                  <div className="create-icon-wrap">
                    <div className="create-icon-circle"><PlusIcon /></div>
                    <span className="create-icon-label">New board</span>
                  </div>
                </div>
                <div className="board-info">
                  <div className="board-name" style={{ color: '#9ca3af' }}>Create a board</div>
                  <div className="board-meta">Start collaborating</div>
                </div>
              </div>

              {visible.length === 0 && search && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <SearchIcon /><p>No boards match &ldquo;{search}&rdquo;</p>
                </div>
              )}
              {visible.length === 0 && !search && section === 'starred' && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <StarIcon /><p>No starred boards yet.</p>
                </div>
              )}

              {visible.map(board => (
                <div
                  key={board.id}
                  id={`board-card-${board.id}`}
                  className="board-card"
                  onClick={() => openBoard(board.id)}
                >
                  {/* Options button — top-right of thumbnail */}
                  <BoardOptionsMenu
                    board={board}
                    onShare={setShareBoard}
                    onDownload={handleDownload}
                    onRemove={setRemoveBoard}
                  />

                  <div className="board-thumbnail" style={{ background: boardGradient(board.color) }}>
                    <BoardArt color={board.color} />
                    <div className="board-open-hint"><OpenIcon /> Open</div>
                  </div>

                  <div className="board-info">
                    <div className="board-info-top">
                      <span className="board-name">{board.name}</span>
                      <button
                        id={`star-btn-${board.id}`}
                        className={`board-star-btn ${board.starred ? 'starred' : ''}`}
                        onClick={e => toggleStar(board.id, e)}
                        title={board.starred ? 'Unstar' : 'Star'}
                      >
                        <StarIcon filled={board.starred} />
                      </button>
                    </div>
                    <div className="board-meta">Updated {board.updated}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {viewMode === 'list' && (
            <div className="board-list">
              <div className="board-list-header">
                <span className="board-list-header-cell">Name</span>
                <span className="board-list-header-cell">Last updated</span>
                <span className="board-list-header-cell">Owner</span>
                <span className="board-list-header-cell"></span>
              </div>

              {visible.length === 0 && (
                <div className="empty-state">
                  <p>{search ? `No boards match "${search}"` : 'No boards here yet.'}</p>
                </div>
              )}

              {visible.map(board => (
                <div
                  key={board.id}
                  id={`board-row-${board.id}`}
                  className="board-list-row"
                  onClick={() => openBoard(board.id)}
                >
                  <div className="board-list-name">
                    <div className="board-list-icon" style={{ background: boardGradient(board.color) }}>
                      <BoardArt color={board.color} />
                    </div>
                    <span className="board-list-name-text">{board.name}</span>
                  </div>
                  <span className="board-list-meta">{board.updated}</span>
                  <span className="board-list-meta">{user?.username || 'You'}</span>
                  <div className="board-list-actions">
                    <button
                      id={`list-star-btn-${board.id}`}
                      className={`board-star-btn ${board.starred ? 'starred' : ''}`}
                      onClick={e => toggleStar(board.id, e)}
                      title={board.starred ? 'Unstar' : 'Star'}
                    >
                      <StarIcon filled={board.starred} />
                    </button>
                    <BoardOptionsMenu
                      board={board}
                      onShare={setShareBoard}
                      onDownload={handleDownload}
                      onRemove={setRemoveBoard}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ═══ MODALS ════════════════════════════════ */}
      {showCreate  && <CreateBoardModal   onClose={() => setShowCreate(false)}  onCreate={handleCreate} />}
      {shareBoard  && <ShareModal         board={shareBoard}  onClose={() => setShareBoard(null)} />}
      {removeBoard && <ConfirmRemoveModal board={removeBoard} onClose={() => setRemoveBoard(null)} onConfirm={handleRemoveConfirm} />}
      {showResetPw && <ResetPasswordModal onClose={() => setShowResetPw(false)} />}
    </div>
  );
}
