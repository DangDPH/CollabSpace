/**
 * context/AuthContext.jsx
 * Global auth state — accessible anywhere via useAuth() hook.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true on first load

  /* ── Restore session on mount ─────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Login ─────────────────────────────────────── */
  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('access_token', data.access_token);
    // Fetch full profile
    const profile = await authApi.me();
    setUser(profile.data);
    return profile.data;
  }, []);

  /* ── Register ──────────────────────────────────── */
  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    return data;
  }, []);

  /* ── Logout ────────────────────────────────────── */
  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Convenience hook */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
