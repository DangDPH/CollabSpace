// ─── Event type registry ───────────────────────────────────────────────────
// Single source of truth — import from here, never hardcode strings elsewhere.

module.exports = {
  // Room lifecycle
  JOIN_BOARD:  'join_board',
  LEAVE_BOARD: 'leave_board',
  USER_JOINED: 'user_joined',   // server → others: someone arrived
  USER_LEFT:   'user_left',     // server → others: someone left
  ROOM_USERS:  'room_users',    // server → all:    full user list snapshot

  // Collaboration
  CANVAS_UPDATE: 'canvas_update',
  TEXT_UPDATE:   'text_update',

  // Chat
  SEND_MESSAGE:    'send_message',
  RECEIVE_MESSAGE: 'receive_message',

  // WebRTC voice signaling
  VOICE_JOIN:          'voice_join',
  VOICE_LEAVE:         'voice_leave',
  VOICE_OFFER:         'voice_offer',
  VOICE_ANSWER:        'voice_answer',
  VOICE_ICE_CANDIDATE: 'voice_ice_candidate',
  TOGGLE_MUTE:         'toggle_mute',

  // System
  ERROR: 'error',
};
