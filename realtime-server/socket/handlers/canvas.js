const EVENTS = require('../../utils/eventTypes');

/**
 * Canvas handler — receives a delta from one client and relays it to
 * every other user in the same room. The sender is excluded (socket.to)
 * because they already applied the change locally (optimistic UI).
 *
 * Expected payload:
 * {
 *   board_id: "abc",
 *   user_id:  "u1",
 *   payload: {
 *     op:        "draw" | "erase" | "move" | "add_shape" | "delete",
 *     object_id: "uuid",   // stable ID for conflict-free updates
 *     data:      { ... }   // only the changed fields (delta, not full state)
 *   }
 * }
 */
module.exports = (socket) => {
  socket.on(EVENTS.CANVAS_UPDATE, (data) => {
    const { board_id, user_id, payload } = data;

    if (!board_id || !payload) {
      return socket.emit(EVENTS.ERROR, { message: 'canvas_update: missing board_id or payload' });
    }

    // Relay delta to everyone else — sender already updated locally
    socket.to(board_id).emit(EVENTS.CANVAS_UPDATE, {
      type: EVENTS.CANVAS_UPDATE,
      board_id,
      user_id,
      payload,
      timestamp: Date.now(),
    });
  });
};
