import { Link, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
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
import { useCart } from './context/CartContext.jsx';
import './styles.css';

function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
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
          {user && <Link to="/cart">Cart ({cartCount})</Link>}
          {user && <Link to="/orders">Orders</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
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
        <Route path="/" element={<ProductListPage />} />
        <Route path="/products/:idOrSlug" element={<ProductDetailsPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
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
