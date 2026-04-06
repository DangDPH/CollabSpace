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
  const [roomUsers, setRoomUsers] = useState([]);

  useEffect(() => {
    if (!boardId || !userId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';

    const newSocket = io(socketUrl, {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
      transports: ['websocket'], // Force WebSocket for tunnel stability
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);

      newSocket.emit('join_board', {
        board_id: boardId,
        user_id: userId,
        username: username || userId,
      });
    });

    newSocket.on('room_users', ({ users }) => {
      if (Array.isArray(users)) setRoomUsers(users);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    newSocket.onAny((eventName, ...args) => {
      console.log('[Socket] <<', eventName, args);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_board', { board_id: boardId, user_id: userId });
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
      setRoomUsers([]);
    };
  }, [boardId, userId, username]);

  const value = useMemo(() => ({
    socket,
    connected,
    boardId,
    userId,
    username,
    roomUsers,
  }), [socket, connected, boardId, userId, username, roomUsers]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** Hook to access the shared socket from any component */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
