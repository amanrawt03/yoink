import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import YoinkLogo from '../components/YoinkLogo.jsx';
import { LoadingState } from '../components/PageStates.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading)
    return (
      <main className="auth-page">
        <LoadingState label="Loading your Yoink account…" />
      </main>
    );
  if (user) return <Navigate to="/" replace />;

  const update = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const email = form.email.trim();
    if (isRegister && form.name.trim().length < 2)
      return setError('Name must be at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (isRegister && form.password.length < 8)
      return setError('Password must be at least 8 characters.');
    if (!form.password || form.password.length > 128)
      return setError('Enter a password up to 128 characters.');
    setSubmitting(true);
    try {
      if (isRegister) await register({ ...form, email });
      else await login({ email, password: form.password });
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <aside className="auth-aside">
          <YoinkLogo light />
          <span className="auth-sparkle" aria-hidden="true">
            ✦
          </span>
          <p className="eyebrow">GOOD FINDS. GREAT PRICES.</p>
          <h2>{isRegister ? 'Your next favorite is waiting.' : 'The good deals missed you.'}</h2>
          <p>
            {isRegister
              ? 'Join the hunt for everyday wins and little surprises.'
              : 'Pick up where you left off and see what’s worth a yoink today.'}
          </p>
          <div className="auth-perk">
            <span aria-hidden="true">✳</span> Fresh finds, fair prices, zero fuss.
          </div>
        </aside>
        <div className="auth-content">
          <p className="eyebrow">{isRegister ? 'JOIN THE FUN' : 'YOUR ACCOUNT'}</p>
          <h1 id="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth-intro">
            {isRegister ? 'A few details and you’re in.' : 'Log in to get back to the good stuff.'}
          </p>
          <form className="auth-form" onSubmit={submit} noValidate>
            {isRegister && (
              <label>
                Name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.name}
                  onChange={update}
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={isRegister ? 8 : undefined}
                maxLength={128}
                value={form.password}
                onChange={update}
                placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              />
            </label>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'One sec…' : isRegister ? 'Create my account' : 'Log in'}
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to Yoink?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
