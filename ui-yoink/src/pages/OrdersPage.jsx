import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    orderApi
      .myOrders()
      .then(setOrders)
      .catch((err) =>
        setError(
          err.response?.status === 401
            ? 'Please log in to view your orders.'
            : 'Unable to load orders.',
        ),
      );
  }, []);
  return (
    <main className="cart-page">
      <h1>Your orders</h1>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {orders === null && !error && <p role="status">Loading orders…</p>}
      {orders?.length === 0 && (
        <p>
          You have not placed any orders yet. <Link to="/">Browse products</Link>
        </p>
      )}
      {orders?.map((order) => (
        <article className="order-row" key={order._id}>
          <div>
            <strong>Order {order._id}</strong>
            <p>
              {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
            </p>
          </div>
          <div>
            <p>
              {order.status} · payment {order.paymentStatus}
            </p>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>
          <Link className="primary-link" to={`/orders/${order._id}`}>
            View order
          </Link>
        </article>
      ))}
    </main>
  );
}
