import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import AuthModal from './components/AuthModal.jsx';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards.jsx';
import { useAuth } from './context/AuthContext.jsx';
import ProductListPage from './pages/ProductListPage.jsx';
import ProductDetailsPage from './pages/ProductDetailsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminLayout from './pages/AdminLayout.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminProductsPage from './pages/AdminProductsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import { NotFoundState } from './components/PageStates.jsx';
import { useCart } from './context/CartContext.jsx';
import YoinkLogo from './components/YoinkLogo.jsx';
import './styles.css';

function NavIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
      </>
    ),
    cart: (
      <>
        <path d="M2 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L21 8H5" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h12a2 2 0 0 1 2 2v16l-3-2-4 2-4-2-3 2V5a2 2 0 0 1 2-2Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    admin: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
  };
  return (
    <svg
      className={`nav-icon nav-icon-${name}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function ThemeMenuItem({ theme, onToggle }) {
  return (
    <button
      className="profile-theme-toggle"
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'dark'}
      title={`${theme === 'dark' ? 'Dark' : 'Light'} mode`}
      onClick={onToggle}
    >
      <span>Theme</span>
      <span className="profile-theme-icon" aria-hidden="true">
        {theme === 'dark' ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        )}
      </span>
    </button>
  );
}

function Layout() {
  const [authOpen, setAuthOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('yoink-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const { user, logout } = useAuth();
  const location = useLocation();
  const { cart } = useCart();
  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const navigate = useNavigate();
  const signOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem('yoink-theme', theme);
    } catch {
      // The selected theme still applies for this session if storage is unavailable.
    }
  }, [theme]);
  useEffect(() => {
    if (location.state?.openAuth) {
      setAuthOpen(true);
      navigate('/', { replace: true, state: null });
    }
  }, [location.state, navigate]);
  useEffect(() => {
    const closeProfileMenu = () => {
      if (profileMenuRef.current) profileMenuRef.current.open = false;
    };
    const onPointerDown = (event) => {
      if (profileMenuRef.current?.open && !profileMenuRef.current.contains(event.target)) {
        closeProfileMenu();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeProfileMenu();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  return (
    <>
      <header
        className={location.pathname === '/' ? 'site-header home-site-header' : 'site-header'}
      >
        <Link to="/" aria-label="Yoink home">
          <YoinkLogo />
        </Link>
        <nav>
          <Link className="nav-link" to="/" aria-label="Home">
            <NavIcon name="home" />
            <span className="nav-label home-nav-label">Home</span>
          </Link>
          {user && (
            <Link className="nav-link" to="/cart" aria-label={`Cart, ${cartCount} items`}>
              <NavIcon name="cart" />
              <span className="nav-label">Cart</span>
              <span className="cart-count">{cartCount}</span>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link className="nav-link" to="/admin">
              <NavIcon name="admin" />
              <span className="nav-label">Admin</span>
            </Link>
          )}
          {user ? (
            <details className="profile-menu" ref={profileMenuRef}>
              <summary aria-label={`Profile menu for ${user.name}`}>
                <NavIcon name="profile" />
                <span className="profile-name">{user.name}</span>
                <NavIcon name="chevron" />
              </summary>
              <div className="profile-dropdown">
                <p className="profile-welcome">Welcome, {user.name.trim().split(/\s+/)[0]}</p>
                <Link
                  className="profile-menu-link"
                  to="/orders"
                  onClick={() => {
                    if (profileMenuRef.current) profileMenuRef.current.open = false;
                  }}
                >
                  <span>Track your orders</span>
                </Link>
                <ThemeMenuItem
                  theme={theme}
                  onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                />
                <button className="profile-logout" onClick={signOut}>
                  Log out
                </button>
              </div>
            </details>
          ) : (
            <button
              className="nav-link profile-trigger"
              type="button"
              onClick={() => setAuthOpen(true)}
              aria-label="Sign in or create an account"
            >
              <NavIcon name="profile" />
              <span className="nav-label">Sign in</span>
            </button>
          )}
        </nav>
      </header>
      <Outlet />
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuthenticated={() => {
            setAuthOpen(false);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/login" element={<Navigate to="/" replace state={{ openAuth: true }} />} />
        <Route path="/register" element={<Navigate to="/" replace state={{ openAuth: true }} />} />
        <Route path="/products/:idOrSlug" element={<ProductDetailsPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
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
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <NotFoundState
              action={
                <Link className="primary-link" to="/">
                  Return home
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  );
}
