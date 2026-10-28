import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    orderApi
      .allOrders()
      .then(setOrders)
      .catch((err) =>
        setError(
          err.response?.status === 403 ? 'Admin access is required.' : 'Unable to load orders.',
        ),
      );
  }, []);
  const change = async (id, status) => {
    try {
      const updated = await orderApi.updateStatus(id, status);
      setOrders((current) => current.map((order) => (order._id === id ? updated : order)));
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
      {!orders && !error && <p role="status">Loading orders…</p>}
      {orders?.length === 0 && <p>No orders yet.</p>}
      {orders?.map((order) => (
        <article className="order-row" key={order._id}>
          <div>
            <strong>
              <Link to={`/orders/${order._id}`}>{order._id}</Link>
            </strong>
            <p>
              {order.shippingAddress.fullName} · {new Date(order.createdAt).toLocaleDateString()}
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
    </main>
  );
}
