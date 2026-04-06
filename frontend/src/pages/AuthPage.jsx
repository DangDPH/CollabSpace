/**
 * pages/AuthPage.jsx
 * Two-panel auth layout:
 *   Left  — warm peach branding panel with features
 *   Right — login / register form card
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import '../auth.css';

/* === Icons === */
const WorkspaceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const CanvasIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
  </svg>
);

const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const VoiceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const BrandIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8.5 18L12 10L15.5 18L20 6"
      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after successful login — either the page they tried to visit or /dashboard
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  // If already authenticated, redirect immediately (e.g. user navigates to /auth manually)
  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const handleLogin = async (credentials) => {
    await login(credentials);
    navigate(redirectTo, { replace: true });
  };

  const handleRegister = async (payload) => {
    await register(payload);
    setTab('login');
    return 'Account created! Please sign in.';
  };

  return (
    <div className="auth-page">
      {/* ── Left branding panel ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <WorkspaceIcon />
          </div>
          <h2>Realtime Collaborative Workspace</h2>
          <p>
            Draw on a shared canvas, edit documents together,
            chat and voice call — all in real time.
          </p>

          <div className="auth-features">
            <div className="auth-feature-pill"><CanvasIcon /> Canvas</div>
            <div className="auth-feature-pill"><DocIcon /> Documents</div>
            <div className="auth-feature-pill"><ChatIcon /> Chat</div>
            <div className="auth-feature-pill"><VoiceIcon /> Voice</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Brand mark */}
          <div className="auth-brand">
            <div className="auth-brand-icon"><BrandIcon /></div>
            <span className="auth-brand-name">CollabSpace</span>
          </div>

          {/* Tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              id="tab-login"
              role="tab"
              aria-selected={tab === 'login'}
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              role="tab"
              aria-selected={tab === 'register'}
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
            >
              Create Account
            </button>
          </div>

          {/* Form body */}
          {tab === 'login'
            ? <LoginForm onSubmit={handleLogin} onSwitchTab={() => setTab('register')} />
            : <RegisterForm onSubmit={handleRegister} onSwitchTab={() => setTab('login')} />
          }
        </div>
      </div>
    </div>
  );
}
