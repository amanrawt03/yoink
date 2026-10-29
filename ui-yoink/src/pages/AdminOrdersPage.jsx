import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export default function AdminOrdersPage() {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [paymentBusy, setPaymentBusy] = useState('');
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
  const markPaid = async (id) => {
    setPaymentBusy(id);
    setError('');
    try {
      const updated = await orderApi.markPaid(id);
      setResult((currentResult) => ({
        ...currentResult,
        orders: currentResult.orders.map((order) =>
          order._id === id ? { ...updated, user: order.user } : order,
        ),
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update payment status.');
    } finally {
      setPaymentBusy('');
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
        <article className="order-row admin-order-row" key={order._id}>
          <div className="admin-order-summary">
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
            <strong className="admin-order-total">{formatCurrency(order.totalAmount)}</strong>
          </div>
          <label className="admin-order-control">
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
          <div className="order-payment admin-order-control">
            <span className={`payment-state payment-state-${order.paymentStatus}`}>
              {order.paymentStatus === 'paid' ? 'Paid' : `Payment ${order.paymentStatus}`}
            </span>
            {order.paymentStatus === 'pending' && order.status !== 'cancelled' && (
              <button
                className="secondary-button"
                type="button"
                disabled={paymentBusy === order._id}
                onClick={() => markPaid(order._id)}
              >
                {paymentBusy === order._id ? 'Saving…' : 'Mark paid'}
              </button>
            )}
          </div>
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
