import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import '../board_bias_styles.css';

import { fetchBoardMetadata } from '../api/boards';
import { useAuth } from '../context/AuthContext';
import { SocketProvider, useSocket } from '../context/SocketContext';

import Whiteboard from '../components/canvasUI/canvas/white_board';
import DocumentEditor from '../components/textEditor/TextEditor';
import ChatBox from '../components/ChatBox';
import VoiceBox from '../components/VoiceBox';

// Optional: A simple ErrorBoundary fallback wrap if not implemented
const ErrorFallback = ({ children }) => <>{children}</>;

/* ── Avatar helpers ────────────────────────────────────────── */
function getInitials(username) {
  if (!username) return '?';
  const parts = username.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : username.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#4da6ff','#a78bfa','#6ee7b7','#fcd34d',
  '#f9a8d4','#fd8a5a','#86efac','#c4b5fd',
];

function avatarColor(username = '') {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Inner board (must be inside SocketProvider to call useSocket) ── */
function BoardInner({ id }) {
  const navigate = useNavigate();
  const { roomUsers } = useSocket();

  const [mode, setMode] = useState(
    localStorage.getItem("workspace-mode") || "split"
  );
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem("workspace-left-width");
    return saved ? Number(saved) : window.innerWidth * 0.5;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [boardName, setBoardName] = useState("Loading...");
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  useEffect(() => {
    async function loadMetadata() {
      try {
        const data = await fetchBoardMetadata(id);
        setBoardName(data.name || "Untitled Board");
      } catch (err) {
        console.error("Failed to load board metadata", err);
        setBoardName("Board Not Found");
      }
    }
    if (id) loadMetadata();
  }, [id]);

  useEffect(() => { localStorage.setItem("workspace-mode", mode); }, [mode]);
  useEffect(() => { localStorage.setItem("workspace-left-width", String(leftWidth)); }, [leftWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || mode !== "split") return;
      const minLeft = 360, minRight = 320;
      const maxLeft = window.innerWidth - minRight;
      setLeftWidth(Math.min(Math.max(e.clientX, minLeft), maxLeft));
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, mode]);

  /* ── Max 5 avatars shown, rest collapsed ── */
  const MAX_VISIBLE = 5;
  const visibleUsers = roomUsers.slice(0, MAX_VISIBLE);
  const hiddenCount  = roomUsers.length - MAX_VISIBLE;

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.leftGroup}>
          <div style={styles.logo}>{boardName}</div>
          <div style={styles.modeGroup}>
            <button style={mode === "canvas"   ? styles.activeButton : styles.button} onClick={() => setMode("canvas")}>Canvas</button>
            <button style={mode === "document" ? styles.activeButton : styles.button} onClick={() => setMode("document")}>Document</button>
            <button style={mode === "split"    ? styles.activeButton : styles.button} onClick={() => setMode("split")}>Split</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ── Live user avatars ── */}
          {roomUsers.length > 0 && (
            <div style={styles.avatarStrip}>
              {visibleUsers.map((u, i) => (
                <div
                  key={u.user_id || i}
                  title={u.username}
                  style={{
                    ...styles.avatar,
                    background: avatarColor(u.username),
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: MAX_VISIBLE - i,
                  }}
                >
                  {getInitials(u.username)}
                </div>
              ))}
              {hiddenCount > 0 && (
                <div style={{ ...styles.avatar, background: '#94a3b8', marginLeft: -8, zIndex: 0 }}>
                  +{hiddenCount}
                </div>
              )}
            </div>
          )}

          {/* ── Share & Back ── */}
          <button
            style={{...styles.button, border: '1px solid #0f62fe', color: '#0f62fe'}}
            onClick={handleShare}
          >
            {showShareTooltip ? '✅ Copied!' : '🔗 Share'}
          </button>
          <button
            style={{...styles.button, border: '1px solid #ff4d4f', color: '#ff4d4f'}}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {mode === "canvas" && (
          <div style={styles.fullPane}>
            <ErrorFallback><Whiteboard boardId={id} /></ErrorFallback>
          </div>
        )}
        {mode === "document" && (
          <div style={styles.fullPane}>
            <ErrorFallback><DocumentEditor boardId={id} /></ErrorFallback>
          </div>
        )}
        {mode === "split" && (
          <div style={styles.layout}>
            <div style={{ ...styles.leftPane, width: leftWidth }}>
              <ErrorFallback><Whiteboard boardId={id} /></ErrorFallback>
            </div>
            <div style={styles.divider} onMouseDown={() => setIsDragging(true)} title="Drag to resize" />
            <div style={styles.rightPane}>
              <ErrorFallback><DocumentEditor boardId={id} /></ErrorFallback>
            </div>
          </div>
        )}
      </div>

      <ChatBox />
      <VoiceBox />
    </div>
  );
}

/* ── Outer page wraps SocketProvider ──────────────────────── */
export default function BoardPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const userId   = user?.id || user?._id || 'anonymous';
  const username = user?.username || 'Guest';

  return (
    <SocketProvider boardId={id} userId={String(userId)} username={username}>
      <BoardInner id={id} />
    </SocketProvider>
  );
}

const styles = {
  page: {
    width: "100%", /* 100vw causes horizontal scroll in some setups, % is safer */
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#e2e8f0",
  },
  topbar: {
    height: 56,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: "#ffffff",
    borderBottom: "1px solid #dbe3ec",
    position: "relative",
    zIndex: 100,
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  logo: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  modeGroup: {
    display: "flex",
    gap: 8,
  },
  button: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #dbe3ec",
    background: "#fff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 500,
  },
  activeButton: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #4da6ff",
    background: "#eaf4ff",
    color: "#0f62fe",
    cursor: "pointer",
    fontWeight: 600,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  fullPane: {
    width: "100%",
    height: "100%",
  },
  layout: {
    width: "100%",
    height: "100%",
    display: "flex",
    overflow: "hidden",
    background: "#e2e8f0",
  },
  leftPane: {
    minWidth: 0,
    height: "100%",
    flexShrink: 0,
    position: "relative",
  },
  divider: {
    width: "10px",
    cursor: "col-resize",
    background: "linear-gradient(to right, #e2e8f0, #cbd5e1, #e2e8f0)",
    flexShrink: 0,
    zIndex: 10,
  },
  rightPane: {
    flex: 1,
    minWidth: 320,
    height: "100%",
    background: "#fff",
    position: "relative",
  },
  avatarStrip: {
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    border: "2px solid #fff",
    cursor: "default",
    userSelect: "none",
    flexShrink: 0,
  },
};
