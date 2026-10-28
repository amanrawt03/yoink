import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    orderApi
      .getOrder(id)
      .then(setOrder)
      .catch((err) =>
        setError(
          err.response?.status === 404
            ? 'Order not found.'
            : err.response?.status === 401
              ? 'Please log in to view this order.'
              : 'Unable to load this order.',
        ),
      );
  }, [id]);
  if (error)
    return (
      <main className="cart-page">
        <h1>Order unavailable</h1>
        <p className="notice error" role="alert">
          {error}
        </p>
        <Link to="/orders">Your orders</Link>
      </main>
    );
  if (!order)
    return (
      <main className="cart-page">
        <p role="status">Loading order…</p>
      </main>
    );
  return (
    <main className="cart-page">
      <p className="eyebrow">ORDER CONFIRMATION</p>
      <h1>Thank you for your order</h1>
      <p>
        Order {order._id} · {new Date(order.createdAt).toLocaleString()}
      </p>
      <p>
        Status: <strong>{order.status}</strong> · Payment:{' '}
        <strong>{order.paymentStatus} (cash on delivery)</strong>
      </p>
      <section className="order-items">
        {order.items.map((item) => (
          <article className="cart-item" key={item.product}>
            <img src={item.image} alt="" />
            <div className="cart-item-info">
              <h2>{item.name}</h2>
              <p>
                {formatCurrency(item.price)} × {item.quantity}
              </p>
            </div>
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
          </article>
        ))}
      </section>
      <div className="cart-summary">
        <p>
          Total <strong>{formatCurrency(order.totalAmount)}</strong>
        </p>
      </div>
      <h2>Shipping address</h2>
      <address>
        {order.shippingAddress.fullName}
        <br />
        {order.shippingAddress.addressLine1}
        {order.shippingAddress.addressLine2 && (
          <>
            <br />
            {order.shippingAddress.addressLine2}
          </>
        )}
        <br />
        {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
        {order.shippingAddress.postalCode}
        <br />
        {order.shippingAddress.country}
      </address>
      <p>
        <Link to="/orders">View all orders</Link>
      </p>
    </main>
  );
}
