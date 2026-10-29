import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api.js';
import { EmptyState, LoadingState } from '../components/PageStates.jsx';
import { formatCurrency } from '../utils/catalog.js';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch(() => setError('Unable to load dashboard statistics. Please try again.'));
  }, []);
  if (error)
    return (
      <p className="notice error" role="alert">
        {error}
      </p>
    );
  if (!stats) return <LoadingState label="Loading your store overview…" />;
  return (
    <section aria-labelledby="overview-title">
      <h2 id="overview-title">Store overview</h2>
      <div className="admin-metrics">
        <article>
          <span>Products</span>
          <strong>{stats.totalProducts}</strong>
          <Link to="/admin/products">Manage products</Link>
        </article>
        <article>
          <span>Users</span>
          <strong>{stats.totalUsers}</strong>
          <Link to="/admin/users">View users</Link>
        </article>
        <article>
          <span>Orders</span>
          <strong>{stats.totalOrders}</strong>
          <Link to="/admin/orders">Manage orders</Link>
        </article>
        <article>
          <span>Delivered revenue</span>
          <strong>{formatCurrency(stats.revenue)}</strong>
          <small>Delivered orders only</small>
        </article>
      </div>
      <h2>Orders by status</h2>
      {stats.totalOrders === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders will appear here once customers start shopping."
          className="page-state-compact"
        />
      ) : (
        <div className="status-grid">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <article key={status}>
              <span>{status}</span>
              <strong>{count}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
