import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export default function AdminOrdersPage() {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  useEffect(() => {
    setResult(null);
    orderApi
      .allOrders({ page, limit: 20 })
      .then(setResult)
      .catch((err) =>
        setError(
          err.response?.status === 403 ? 'Admin access is required.' : 'Unable to load orders.',
        ),
      );
  }, [page]);
  const change = async (id, status) => {
    const current = result.orders.find((order) => order._id === id);
    if (status !== current?.status && !window.confirm(`Change order status to “${status}”?`))
      return;
    try {
      const updated = await orderApi.updateStatus(id, status);
      setResult((currentResult) => ({
        ...currentResult,
        orders: currentResult.orders.map((order) =>
          order._id === id ? { ...updated, user: order.user } : order,
        ),
      }));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update order.');
    }
  };
  return (
    <main className="cart-page">
      <h1>Manage orders</h1>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!result && !error && <p role="status">Loading orders…</p>}
      {result?.orders.length === 0 && <p>No orders yet.</p>}
      {result?.orders.map((order) => (
        <article className="order-row" key={order._id}>
          <div>
            <strong>
              <Link to={`/orders/${order._id}`}>{order._id}</Link>
            </strong>
            <p>
              {order.user?.name || order.shippingAddress.fullName} ·{' '}
              {order.user?.email || 'Customer account unavailable'} ·{' '}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <strong>{formatCurrency(order.totalAmount)}</strong>
          <label>
            Status
            <select
              value={order.status}
              onChange={(event) => change(order._id, event.target.value)}
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </article>
      ))}
      {result?.pagination.totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {result.pagination.totalPages}
          </span>
          <button disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </main>
  );
}
