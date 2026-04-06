const EVENTS = require('../../utils/eventTypes');

/**
 * Chat handler — broadcasts a message to ALL users in the room,
 * including the sender (io.to vs socket.to).
 */
module.exports = (io, socket) => {
  socket.on(EVENTS.SEND_MESSAGE, (data) => {
    const { board_id, user_id, payload } = data;

    console.log(`[Chat] send_message from ${user_id} in room ${board_id}:`, payload?.text);

    if (!board_id || !payload?.text) {
      console.warn('[Chat] REJECTED: missing board_id or text');
      return socket.emit(EVENTS.ERROR, { message: 'send_message: missing board_id or text' });
    }

    // Check how many sockets are in this room
    const room = io.sockets.adapter.rooms.get(board_id);
    console.log(`[Chat] Room "${board_id}" has ${room ? room.size : 0} sockets`);

    // Broadcast to everyone including sender — server timestamp is the source of truth
    io.to(board_id).emit(EVENTS.RECEIVE_MESSAGE, {
      type:     EVENTS.RECEIVE_MESSAGE,
      board_id,
      user_id,
      payload: {
        ...payload,
        sent_at: Date.now(),
      },
    });

    console.log(`[Chat] Broadcast receive_message to room ${board_id}`);
  });
};
