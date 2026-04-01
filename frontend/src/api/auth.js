// src/api/auth.js
// All auth API calls to the FastAPI backend
import client from './client';

export const authApi = {
  // POST /api/v1/users/register
  register: (data) => client.post('/api/v1/users/register', {
    email: data.email,
    username: data.username,
    password: data.password,
  }),

  // POST /api/v1/users/login
  login: (data) => client.post('/api/v1/users/login', {
    email: data.email,
    password: data.password,
  }),

  // POST /api/v1/users/logout  (needs Bearer token — client.js injects it)
  logout: () => client.post('/api/v1/users/logout'),

  // GET /api/v1/users/me
  me: () => client.get('/api/v1/users/me'),
};
