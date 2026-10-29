import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthModal({ onClose, onAuthenticated }) {
  const { login, register } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const apiMessage = (requestError, fallback) => requestError.response?.data?.message || fallback;

  const continueWithEmail = async (event) => {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!validEmail.test(normalizedEmail)) return setError('Enter a valid email address.');
    setBusy(true);
    try {
      const { data } = await api.post('/api/auth/check-email', { email: normalizedEmail });
      setEmail(normalizedEmail);
      setStep(data.exists ? 'login' : 'signup');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitCredentials = async (event) => {
    event.preventDefault();
    setError('');
    if (step === 'signup' && name.trim().length < 2)
      return setError('Name must be at least 2 characters.');
    if (password.length < 8 || password.length > 128)
      return setError('Password must be between 8 and 128 characters.');
    setBusy(true);
    try {
      if (step === 'login') await login({ email, password });
      else await register({ name: name.trim(), email, password });
      onAuthenticated();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Unable to connect. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="auth-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="auth-modal-heading">
          <p id="auth-modal-title">{step === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</p>
          <button className="auth-modal-close" type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {step === 'email' ? (
          <>
            <h2>Sign in with your email or sign up to become a member.</h2>
            <form className="auth-modal-form" onSubmit={continueWithEmail}>
              <label htmlFor="auth-modal-email">
                Email <span>*</span>
              </label>
              <input
                id="auth-modal-email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
              />
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              <button className="auth-modal-primary" type="submit" disabled={busy}>
                {busy ? 'PLEASE WAIT…' : 'CONTINUE'}
              </button>
            </form>
            <p className="auth-modal-secure">
              <span aria-hidden="true">▣</span> Your account is secure
            </p>
          </>
        ) : (
          <>
            <h2>
              {step === 'login'
                ? 'Please sign in with your email and password.'
                : 'Create an account to join Yoink.'}
            </h2>
            <form className="auth-modal-form" onSubmit={submitCredentials}>
              {step === 'signup' && (
                <>
                  <label htmlFor="auth-modal-name">
                    Name <span>*</span>
                  </label>
                  <input
                    id="auth-modal-name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                  />
                </>
              )}
              <label htmlFor="auth-modal-email-readonly">Email</label>
              <input id="auth-modal-email-readonly" type="email" value={email} readOnly />
              <label htmlFor="auth-modal-password">
                {step === 'signup' ? 'Create a password' : 'Password'} <span>*</span>
              </label>
              <input
                id="auth-modal-password"
                type="password"
                autoComplete={step === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={8}
                maxLength={128}
                autoFocus={step === 'login'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              <button className="auth-modal-primary" type="submit" disabled={busy}>
                {busy ? 'PLEASE WAIT…' : 'CONTINUE'}
              </button>
              <button
                className="auth-modal-secondary"
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setPassword('');
                }}
              >
                BACK TO EMAIL
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
