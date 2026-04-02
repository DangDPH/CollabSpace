/**
 * context/SocketContext.jsx
 * Centralized Socket.IO connection for the entire Board.
 * All components (Canvas, Document, Chat, Voice) share a single socket.
 */
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ boardId, userId, username, children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!boardId || !userId) return;

    // Connect via the Vite proxy — all traffic goes through port 5173
    const newSocket = io('/', {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);

      // Join the board room
      newSocket.emit('join_board', {
        board_id: boardId,
        user_id: userId,
        username: username || userId,
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // DEBUG: log all incoming events so we can trace what the server sends
    newSocket.onAny((eventName, ...args) => {
      console.log('[Socket] <<', eventName, args);
    });

    setSocket(newSocket);

    return () => {
      // Leave the board and disconnect
      newSocket.emit('leave_board', { board_id: boardId, user_id: userId });
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [boardId, userId, username]);

  // Memoize so children don't get infinite re-renders
  const value = useMemo(() => ({
    socket,
    connected,
    boardId,
    userId,
    username,
  }), [socket, connected, boardId, userId, username]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** Hook to access the shared socket from any component */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
