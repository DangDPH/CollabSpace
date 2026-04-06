/**
 * In-memory room manager.
 *
 * Tracks which users are in each board room, supporting multiple boards
 * per socket (unlike storing a single socket.board_id).
 *
 * Structure:
 *   rooms = {
 *     [board_id]: Map { socket_id → { user_id, username } }
 *   }
 */

const rooms = {};

function joinRoom(boardId, socketId, userInfo) {
  if (!rooms[boardId]) rooms[boardId] = new Map();
  rooms[boardId].set(socketId, userInfo);
}

function leaveRoom(boardId, socketId) {
  if (!rooms[boardId]) return;
  rooms[boardId].delete(socketId);
  if (rooms[boardId].size === 0) delete rooms[boardId];
}

function getRoomUsers(boardId) {
  if (!rooms[boardId]) return [];
  return Array.from(rooms[boardId].values());
}

/**
 * Remove a socket from ALL rooms it was in (called on disconnect).
 * Returns the list of affected board IDs so callers can notify each room.
 */
function removeSocketFromAllRooms(socketId) {
  const affected = [];
  for (const boardId of Object.keys(rooms)) {
    if (rooms[boardId].has(socketId)) {
      rooms[boardId].delete(socketId);
      affected.push(boardId);
      if (rooms[boardId].size === 0) delete rooms[boardId];
    }
  }
  return affected;
}

module.exports = { joinRoom, leaveRoom, getRoomUsers, removeSocketFromAllRooms };
