import { Link, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };
  return (
    <>
      <header>
        <Link to="/">Yoink</Link>
        <nav>
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={signOut}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <main>
              <h1>Yoink</h1>
              <p>Authentication is ready.</p>
            </main>
          }
        />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/account"
            element={
              <main>
                <h1>Your account</h1>
              </main>
            }
          />
        </Route>
        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={
              <main>
                <h1>Admin access</h1>
              </main>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <main>
              <h1>Page not found</h1>
              <Link to="/">Return home</Link>
            </main>
          }
        />
      </Route>
    </Routes>
  );
}
