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

export async function fetchBoardMetadata(boardId) {
  const res = await client.get(`/api/v1/boards/${boardId}`);
  return res.data;
}

export async function fetchCanvas(boardId) {
  const res = await client.get(`/api/v1/boards/${boardId}/canvas`);
  return res.data.elements || [];
}

export async function saveCanvas(boardId, elements) {
  await client.put(`/api/v1/boards/${boardId}/canvas`, { elements });
}

export async function fetchDocument(boardId) {
  const res = await client.get(`/api/v1/boards/${boardId}/document`);
  return res.data.html || '';
}

export async function saveDocument(boardId, html) {
  await client.put(`/api/v1/boards/${boardId}/document`, { html });
}
