/**
 * api/boards.js
 * Board CRUD calls to FastAPI backend.
 */
import client from './client';

export async function fetchBoards() {
  const res = await client.get('/api/v1/boards/');
  return res.data; // array of board objects
}

export async function createBoard({ name, color }) {
  const res = await client.post('/api/v1/boards/', {
    name,
    color: color || '#74C0FC',
  });
  // Backend returns { id, name, owner_id, color }
  return { ...res.data, starred: false, updated: 'Just now' };
}

export async function deleteBoard(boardId) {
  await client.delete(`/api/v1/boards/${boardId}`);
}
