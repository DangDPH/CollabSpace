/**
 * components/auth/RegisterForm.jsx
 * Full registration form — username, email, password + confirm,
 * live password-strength indicator, and field-level validation.
 */
import { useState } from 'react';

/* ── Icon helpers ─────────────────────── */
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

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

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

/* ── Password strength calculator ─────── */
function calcStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_CLASSES = ['', 'weak', 'fair', 'good', 'strong'];

/* ── Component ─────────────────────────── */
export default function RegisterForm({ onSubmit, onSwitchTab }) {
  const [form, setForm]         = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [fieldErr, setFieldErr] = useState({});

  const strength = calcStrength(form.password);

  const validate = () => {
    const errs = {};
    if (!form.username.trim())                        errs.username = 'Username is required';
    else if (form.username.trim().length < 3)         errs.username = 'At least 3 characters';
    if (!form.email.trim())                           errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))       errs.email    = 'Enter a valid email';
    if (!form.password)                               errs.password = 'Password is required';
    else if (form.password.length < 8)                errs.password = 'At least 8 characters';
    if (!form.confirm)                                errs.confirm  = 'Please confirm password';
    else if (form.confirm !== form.password)          errs.confirm  = 'Passwords do not match';
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
    setSuccess('');
    try {
      const msg = await onSubmit({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess(msg || 'Account created successfully!');
      setForm({ username: '', email: '', password: '', confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(Array.isArray(msg) ? msg[0]?.msg || 'Error occurred.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join your team&apos;s collaborative workspace</p>
      </div>

      {error   && (
        <div className="auth-alert error"   style={{ marginBottom: 16 }} role="alert">
          <AlertIcon /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="auth-alert success" style={{ marginBottom: 16 }} role="status">
          <CheckIcon /><span>{success}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate id="register-form">

        {/* Username */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-username">Username</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon"><UserIcon /></span>
            <input
              id="reg-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="your_username"
              value={form.username}
              onChange={handleChange}
              className={`form-input ${fieldErr.username ? 'error' : ''}`}
              disabled={loading}
            />
          </div>
          {fieldErr.username && <span className="form-error"><AlertIcon />{fieldErr.username}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">Email address</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon"><MailIcon /></span>
            <input
              id="reg-email"
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
          <label className="form-label" htmlFor="reg-password">Password</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon"><LockIcon /></span>
            <input
              id="reg-password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              className={`form-input ${fieldErr.password ? 'error' : ''}`}
              style={{ paddingRight: 44 }}
              disabled={loading}
            />
            <button type="button" className="form-input-toggle"
              aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw(p => !p)}>
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErr.password && <span className="form-error"><AlertIcon />{fieldErr.password}</span>}

          {/* Strength bars */}
          {form.password && (
            <>
              <div className="password-strength" role="meter" aria-label="Password strength" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4}>
                {[1,2,3,4].map(n => (
                  <div
                    key={n}
                    className={`strength-bar ${strength >= n ? STRENGTH_CLASSES[strength] : ''}`}
                  />
                ))}
              </div>
              <p className="strength-label">
                {strength > 0 && `Strength: ${STRENGTH_LABELS[strength]}`}
              </p>
            </>
          )}
        </div>

        {/* Confirm password */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-confirm">Confirm password</label>
          <div className="form-input-wrapper">
            <span className="form-input-icon"><LockIcon /></span>
            <input
              id="reg-confirm"
              name="confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handleChange}
              className={`form-input ${fieldErr.confirm ? 'error' : ''}`}
              style={{ paddingRight: 44 }}
              disabled={loading}
            />
            <button type="button" className="form-input-toggle"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirm(p => !p)}>
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErr.confirm && <span className="form-error"><AlertIcon />{fieldErr.confirm}</span>}
        </div>

        {/* Submit */}
        <button
          id="register-submit-btn"
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading && <span className="btn-spinner" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{' '}
        <span className="auth-link" onClick={onSwitchTab}>Sign in</span>
      </p>
    </>
  );
}
