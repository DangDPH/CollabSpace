const EVENTS = require('../utils/eventTypes');
const { joinRoom, leaveRoom, getRoomUsers, removeSocketFromAllRooms } = require('../utils/roomManager');

const registerCanvasHandlers = require('./handlers/canvas');
const registerTextHandlers   = require('./handlers/text');
const registerChatHandlers   = require('./handlers/chat');
const registerVoiceHandlers  = require('./handlers/voice');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(` Connected: ${socket.id}`);

    // ── Join board ────────────────────────────────────────────────
    socket.on(EVENTS.JOIN_BOARD, ({ board_id, user_id, username }) => {
      if (!board_id || !user_id) {
        return socket.emit(EVENTS.ERROR, { message: 'join_board requires board_id and user_id' });
      }

      const userInfo = { user_id, username: username || user_id };

      socket.join(board_id);
      joinRoom(board_id, socket.id, userInfo);

      // Log room size for debugging
      const room = io.sockets.adapter.rooms.get(board_id);
      console.log(`[Room] ${userInfo.username} (${socket.id}) joined board ${board_id} — room now has ${room ? room.size : 0} sockets`);

      // Tell other users someone arrived
      socket.to(board_id).emit(EVENTS.USER_JOINED, { user_id, username: userInfo.username });

      // Send the full user list to everyone (including the new arrival)
      io.to(board_id).emit(EVENTS.ROOM_USERS, { board_id, users: getRoomUsers(board_id) });
    });

    // ── Leave board ───────────────────────────────────────────────
    socket.on(EVENTS.LEAVE_BOARD, ({ board_id, user_id }) => {
      if (!board_id) return;

      socket.leave(board_id);
      leaveRoom(board_id, socket.id);

      socket.to(board_id).emit(EVENTS.USER_LEFT, { user_id });
      io.to(board_id).emit(EVENTS.ROOM_USERS, { board_id, users: getRoomUsers(board_id) });

      console.log(` ${user_id} left board ${board_id}`);
    });

    // ── Domain handlers ───────────────────────────────────────────
    registerCanvasHandlers(socket);
    registerTextHandlers(socket);
    registerChatHandlers(io, socket);   // chat needs io (broadcasts to sender too)
    registerVoiceHandlers(io, socket);  // voice needs io (targeted P2P delivery)

    // ── Disconnect cleanup ────────────────────────────────────────
    socket.on('disconnect', () => {
      const affectedBoards = removeSocketFromAllRooms(socket.id);

      for (const board_id of affectedBoards) {
        // Notify remaining users
        socket.to(board_id).emit(EVENTS.USER_LEFT, { socket_id: socket.id });
        io.to(board_id).emit(EVENTS.ROOM_USERS, { board_id, users: getRoomUsers(board_id) });

        // Close any open WebRTC connections to this peer
        socket.to(board_id).emit(EVENTS.VOICE_LEAVE, { from_socket_id: socket.id });
      }

      console.log(` Disconnected: ${socket.id}`);
    });
  });
};
