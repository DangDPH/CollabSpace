/**
 * realtimeClient.js — Frontend integration (React-friendly)
 *
 * Wraps Socket.IO + WebRTC into clean, simple methods.
 *
 * Usage:
 *   import { rtClient } from './realtimeClient';
 *
 *   rtClient.connect('user42', 'Alice');
 *   rtClient.joinBoard('board123');
 *   rtClient.onCanvasUpdate(delta => applyDelta(delta));
 *   rtClient.sendCanvasUpdate({ op: 'draw', object_id: uuid, data: { ... } });
 */

import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_RT_SERVER || 'http://localhost:4000';

const EVENTS = {
  JOIN_BOARD:          'join_board',
  LEAVE_BOARD:         'leave_board',
  USER_JOINED:         'user_joined',
  USER_LEFT:           'user_left',
  ROOM_USERS:          'room_users',
  CANVAS_UPDATE:       'canvas_update',
  TEXT_UPDATE:         'text_update',
  SEND_MESSAGE:        'send_message',
  RECEIVE_MESSAGE:     'receive_message',
  VOICE_JOIN:          'voice_join',
  VOICE_LEAVE:         'voice_leave',
  VOICE_OFFER:         'voice_offer',
  VOICE_ANSWER:        'voice_answer',
  VOICE_ICE_CANDIDATE: 'voice_ice_candidate',
  TOGGLE_MUTE:         'toggle_mute',
  ERROR:               'error',
};

class RealtimeClient {
  constructor() {
    this.socket        = null;
    this.userId        = null;
    this.username      = null;
    this.currentBoard  = null;

    // WebRTC state
    this.peerConnections = {};   // { socket_id: RTCPeerConnection }
    this.localStream     = null;

    // Internal callbacks
    this._onRemoteStream = null;
  }

  // ── Connection ─────────────────────────────────────────────────

  connect(userId, username) {
    this.userId   = userId;
    this.username = username;
    this.socket   = io(SERVER_URL);

    this.socket.on('connect',    () => console.log(' Connected:', this.socket.id));
    this.socket.on('disconnect', () => console.log(' Disconnected'));
    this.socket.on(EVENTS.ERROR, (e) => console.error('Socket error:', e.message));

    this._bindVoiceSignaling();
    return this;
  }

  disconnect() {
    this.leaveVoice();
    this.socket?.disconnect();
  }

  // ── Room ────────────────────────────────────────────────────────

  joinBoard(boardId) {
    this.currentBoard = boardId;
    this.socket.emit(EVENTS.JOIN_BOARD, {
      board_id: boardId,
      user_id:  this.userId,
      username: this.username,
    });
    return this;
  }

  leaveBoard() {
    if (!this.currentBoard) return;
    this.socket.emit(EVENTS.LEAVE_BOARD, {
      board_id: this.currentBoard,
      user_id:  this.userId,
    });
    this.currentBoard = null;
    return this;
  }

  onUserJoined(cb) { this.socket.on(EVENTS.USER_JOINED, cb); return this; }
  onUserLeft(cb)   { this.socket.on(EVENTS.USER_LEFT,   cb); return this; }
  onRoomUsers(cb)  { this.socket.on(EVENTS.ROOM_USERS,  ({ users }) => cb(users)); return this; }

  // ── Canvas ──────────────────────────────────────────────────────

  sendCanvasUpdate(delta) {
    // delta = { op, object_id, data }
    this.socket.emit(EVENTS.CANVAS_UPDATE, {
      board_id: this.currentBoard,
      user_id:  this.userId,
      payload:  delta,
    });
    return this;
  }

  onCanvasUpdate(cb) {
    this.socket.on(EVENTS.CANVAS_UPDATE, ({ user_id, payload, timestamp }) =>
      cb({ user_id, ...payload, timestamp })
    );
    return this;
  }

  // ── Text ────────────────────────────────────────────────────────

  sendTextUpdate(docId, ops, version = 0) {
    this.socket.emit(EVENTS.TEXT_UPDATE, {
      board_id: this.currentBoard,
      user_id:  this.userId,
      payload:  { doc_id: docId, ops, version },
    });
    return this;
  }

  onTextUpdate(cb) {
    this.socket.on(EVENTS.TEXT_UPDATE, ({ user_id, payload, timestamp }) =>
      cb({ user_id, ...payload, timestamp })
    );
    return this;
  }

  // ── Chat ────────────────────────────────────────────────────────

  sendChatMessage(text) {
    this.socket.emit(EVENTS.SEND_MESSAGE, {
      board_id: this.currentBoard,
      user_id:  this.userId,
      payload:  {
        message_id: crypto.randomUUID(),
        text,
        username: this.username,
      },
    });
    return this;
  }

  onChatMessage(cb) {
    // Server sends RECEIVE_MESSAGE (not SEND_MESSAGE) to all including sender
    this.socket.on(EVENTS.RECEIVE_MESSAGE, ({ user_id, payload }) =>
      cb({ user_id, ...payload })
    );
    return this;
  }

  // ── Voice / WebRTC ──────────────────────────────────────────────

  async joinVoice() {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.socket.emit(EVENTS.VOICE_JOIN, {
      board_id: this.currentBoard,
      user_id:  this.userId,
    });

    return this.localStream;
  }

  leaveVoice() {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;

    for (const pc of Object.values(this.peerConnections)) pc.close();
    this.peerConnections = {};

    if (this.currentBoard) {
      this.socket.emit(EVENTS.VOICE_LEAVE, {
        board_id: this.currentBoard,
        user_id:  this.userId,
      });
    }
    return this;
  }

  toggleMute() {
    if (!this.localStream) return false;
    const track    = this.localStream.getAudioTracks()[0];
    track.enabled  = !track.enabled;
    const isMuted  = !track.enabled;

    this.socket.emit(EVENTS.TOGGLE_MUTE, {
      board_id: this.currentBoard,
      user_id:  this.userId,
      payload:  { muted: isMuted },
    });

    return isMuted;
  }

  onRemoteStream(cb) {
    this._onRemoteStream = cb;
    return this;
  }

  onToggleMute(cb) {
    this.socket.on(EVENTS.TOGGLE_MUTE, ({ user_id, payload }) => cb(user_id, payload.muted));
    return this;
  }

  // ── Internal WebRTC helpers ─────────────────────────────────────

  _createPeerConnection(targetSocketId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Attach local audio tracks
    this.localStream?.getTracks().forEach(t => pc.addTrack(t, this.localStream));

    // Send ICE candidates to the specific peer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit(EVENTS.VOICE_ICE_CANDIDATE, {
          board_id: this.currentBoard,
          user_id:  this.userId,
          payload:  { candidate, target_socket_id: targetSocketId },
        });
      }
    };

    // Forward remote audio stream to app
    pc.ontrack = ({ streams }) => {
      this._onRemoteStream?.(targetSocketId, streams[0]);
    };

    this.peerConnections[targetSocketId] = pc;
    return pc;
  }

  _bindVoiceSignaling() {
    // A new peer joined → we are an existing peer → send them an offer
    this.socket.on(EVENTS.VOICE_JOIN, async ({ from_socket_id }) => {
      const pc    = this._createPeerConnection(from_socket_id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket.emit(EVENTS.VOICE_OFFER, {
        board_id: this.currentBoard,
        user_id:  this.userId,
        payload:  { sdp: offer, target_socket_id: from_socket_id },
      });
    });

    // We received an offer → create an answer
    this.socket.on(EVENTS.VOICE_OFFER, async ({ payload: { sdp, from_socket_id } }) => {
      const pc     = this._createPeerConnection(from_socket_id);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket.emit(EVENTS.VOICE_ANSWER, {
        board_id: this.currentBoard,
        user_id:  this.userId,
        payload:  { sdp: answer, target_socket_id: from_socket_id },
      });
    });

    // We received an answer → complete the connection
    this.socket.on(EVENTS.VOICE_ANSWER, async ({ payload: { sdp, from_socket_id } }) => {
      const pc = this.peerConnections[from_socket_id];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // ICE candidate from a peer → add to their connection
    this.socket.on(EVENTS.VOICE_ICE_CANDIDATE, async ({ payload: { candidate, from_socket_id } }) => {
      const pc = this.peerConnections[from_socket_id];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // A peer left voice → close and clean up their connection
    this.socket.on(EVENTS.VOICE_LEAVE, ({ from_socket_id, payload }) => {
      const id = from_socket_id || payload?.from_socket_id;
      if (id) {
        this.peerConnections[id]?.close();
        delete this.peerConnections[id];
      }
    });
  }
}

// Singleton — import { rtClient } for most apps
export const rtClient = new RealtimeClient();
export default RealtimeClient;
