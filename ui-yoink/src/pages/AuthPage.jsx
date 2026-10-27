import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p role="status">Loading…</p>;
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
    <main>
      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <form onSubmit={submit} noValidate>
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
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Register' : 'Log in'}
        </button>
      </form>
      <p>
        {isRegister ? 'Already have an account?' : 'New to Yoink?'}{' '}
        <Link to={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </main>
  );
}
