const EVENTS = require('../../utils/eventTypes');

/**
 * Text handler — relays document changes to other collaborators.
 * The sender is excluded (optimistic UI — they applied the change locally already).
 *
 * Supports two modes:
 *   1. OT ops mode: payload contains { doc_id, ops[], version }
 *   2. Full HTML mode: payload contains { doc_id, html, version }
 *
 * Both modes are relayed as-is. The frontend decides which to use.
 */
module.exports = (socket) => {
  socket.on(EVENTS.TEXT_UPDATE, (data) => {
    const { board_id, user_id, payload } = data;

    if (!board_id || !payload?.doc_id) {
      return socket.emit(EVENTS.ERROR, { message: 'text_update: missing board_id or doc_id' });
    }

    socket.to(board_id).emit(EVENTS.TEXT_UPDATE, {
      type: EVENTS.TEXT_UPDATE,
      board_id,
      user_id,
      payload,
      timestamp: Date.now(),
    });
  });
};
