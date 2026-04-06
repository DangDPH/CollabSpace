const EVENTS = require('../../utils/eventTypes');

/**
 * Voice / WebRTC signaling handler.
 * The server is a pure signaling relay — audio data never touches it.
 */
module.exports = (io, socket) => {

  // ── Join voice channel ──────────────────────────────────────────
  socket.on(EVENTS.VOICE_JOIN, ({ board_id, user_id, username }) => {
    if (!board_id) return;

    console.log(`[Voice] ${username || user_id} (${socket.id}) joining voice in room ${board_id}`);

    // Notify existing peers — each will send an offer back to socket.id
    socket.to(board_id).emit(EVENTS.VOICE_JOIN, {
      board_id,
      user_id,
      username: username || user_id,
      from_socket_id: socket.id,
    });
  });

  // ── Leave voice channel ─────────────────────────────────────────
  socket.on(EVENTS.VOICE_LEAVE, ({ board_id, user_id }) => {
    if (!board_id) return;

    console.log(`[Voice] ${user_id} (${socket.id}) leaving voice in room ${board_id}`);

    socket.to(board_id).emit(EVENTS.VOICE_LEAVE, {
      board_id,
      user_id,
      from_socket_id: socket.id,
    });
  });

  // ── Offer: caller → specific callee ────────────────────────────
  socket.on(EVENTS.VOICE_OFFER, ({ board_id, user_id, username, payload }) => {
    const { target_socket_id, sdp } = payload || {};
    if (!target_socket_id || !sdp) return;

    console.log(`[Voice] Offer from ${socket.id} -> ${target_socket_id}`);

    io.to(target_socket_id).emit(EVENTS.VOICE_OFFER, {
      board_id,
      user_id,
      username: username || user_id,
      payload: { sdp, from_socket_id: socket.id },
    });
  });

  // ── Answer: callee → specific caller ───────────────────────────
  socket.on(EVENTS.VOICE_ANSWER, ({ board_id, user_id, username, payload }) => {
    const { target_socket_id, sdp } = payload || {};
    if (!target_socket_id || !sdp) return;

    console.log(`[Voice] Answer from ${socket.id} -> ${target_socket_id}`);

    io.to(target_socket_id).emit(EVENTS.VOICE_ANSWER, {
      board_id,
      user_id,
      username: username || user_id,
      payload: { sdp, from_socket_id: socket.id },
    });
  });

  // ── ICE candidates: both directions, targeted ───────────────────
  socket.on(EVENTS.VOICE_ICE_CANDIDATE, ({ board_id, user_id, payload }) => {
    const { target_socket_id, candidate } = payload || {};
    if (!target_socket_id || !candidate) return;

    console.log(`[Voice] Relay ICE Candidate from ${socket.id} -> ${target_socket_id}`);
    io.to(target_socket_id).emit(EVENTS.VOICE_ICE_CANDIDATE, {
      board_id,
      user_id,
      payload: { candidate, from_socket_id: socket.id },
    });
  });

  // ── Mute/unmute: broadcast to room (UI indicator only) ──────────
  socket.on(EVENTS.TOGGLE_MUTE, ({ board_id, user_id, username, payload }) => {
    if (!board_id) return;
    socket.to(board_id).emit(EVENTS.TOGGLE_MUTE, {
      board_id,
      user_id,
      username: username || user_id,
      payload,
      from_socket_id: socket.id,
    });
  });
};
