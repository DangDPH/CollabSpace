/**
 * components/auth/LoginForm.jsx
 * Email + Password login form with show/hide, validation, loading state.
 */
import { useState } from 'react';

/* ── Icon helpers ─────────────────────── */
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Component ─────────────────────────── */
export default function LoginForm({ onSubmit, onSwitchTab }) {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [fieldErr, setFieldErr] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email.trim())                              errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))          errs.email    = 'Enter a valid email';
    if (!form.password)                                  errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErr[name]) setFieldErr(prev => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErr(errs); return; }

    setLoading(true);
    setError('');
    try {
      await onSubmit({ email: form.email, password: form.password });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      setError(Array.isArray(msg) ? msg[0]?.msg || 'Login failed.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your collaborative workspace</p>
      </div>

      {error && (
        <div className="auth-alert error" style={{ marginBottom: 16 }} role="alert">
          <AlertIcon /><span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate id="login-form">
        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email address</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon"><MailIcon /></span>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={`form-input ${fieldErr.email ? 'error' : ''}`}
              disabled={loading}
            />
          </div>
          {fieldErr.email && <span className="form-error"><AlertIcon />{fieldErr.email}</span>}
        </div>

        {/* Password */}
        <div className="form-group">
          <div className="flex justify-between items-center">
            <label className="form-label" htmlFor="login-password">Password</label>
            <span className="text-xs auth-link">Forgot password?</span>
          </div>
          <div className="form-input-wrapper">
            <span className="form-input-icon"><LockIcon /></span>
            <input
              id="login-password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className={`form-input ${fieldErr.password ? 'error' : ''}`}
              style={{ paddingRight: 44 }}
              disabled={loading}
            />
            <button
              type="button"
              className="form-input-toggle"
              aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw(p => !p)}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErr.password && <span className="form-error"><AlertIcon />{fieldErr.password}</span>}
        </div>

        {/* Submit */}
        <button
          id="login-submit-btn"
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading && <span className="btn-spinner" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <span className="auth-link" onClick={onSwitchTab}>Create one free</span>
      </p>
    </>
  );
}
