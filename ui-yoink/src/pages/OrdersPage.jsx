import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';
import { EmptyState, LoadingState } from '../components/PageStates.jsx';

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);
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
      {orders?.length !== 0 && <h1>Your orders</h1>}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {orders === null && !error && <LoadingState label="Loading your orders…" />}
      {orders?.length === 0 && (
        <EmptyState
          title="No orders yet"
          description="Your orders will show up here after checkout."
          action={
            <Link className="primary-link" to="/">
              Browse products
            </Link>
          }
        />
      )}
      {orders?.map((order) => (
        <article className="order-row customer-order-row" key={order._id}>
          <div className="customer-order-info">
            <span className="customer-order-kicker">Order</span>
            <strong>
              <Link to={`/orders/${order._id}`}>#{order._id.slice(-8).toUpperCase()}</Link>
            </strong>
            <p>
              {new Date(order.createdAt).toLocaleDateString()} <span aria-hidden="true">·</span>{' '}
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="customer-order-summary">
            <div className="customer-order-badges">
              <span className={`order-status-badge order-status-${order.status}`}>
                Order: {titleCase(order.status)}
              </span>
              <span className={`payment-state payment-state-${order.paymentStatus}`}>
                Payment: {titleCase(order.paymentStatus)}
              </span>
            </div>
            <strong className="customer-order-total">
              <span>Total</span>
              {formatCurrency(order.totalAmount)}
            </strong>
          </div>
          <Link className="primary-link customer-order-link" to={`/orders/${order._id}`}>
            View order
          </Link>
        </article>
      ))}
    </main>
  );
}
