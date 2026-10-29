import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

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
        <Link className="secondary-button order-history-link" to="/orders">
          View all orders
        </Link>
      </main>
    );
  if (!order)
    return (
      <main className="cart-page">
        <p role="status">Loading order...</p>
      </main>
    );

  return (
    <main className="cart-page order-detail-page">
      <div className="order-confirmation">
        <p className="eyebrow">ORDER CONFIRMATION</p>
        <h1>Thank you for your order</h1>
        <div className="order-detail-meta">
          <span>Order {order._id}</span>
          <span>{new Date(order.createdAt).toLocaleString()}</span>
          <span className={`order-status-badge order-status-${order.status}`}>
            Order: {titleCase(order.status)}
          </span>
        </div>
      </div>

      <div className="order-detail-layout">
        <section className="order-detail-items" aria-labelledby="items-heading">
          <h2 id="items-heading">Items in this order</h2>
          <div className="order-detail-item-list">
            {order.items.map((item) => (
              <article className="order-detail-item" key={item.product}>
                {item.image ? (
                  <img src={item.image} alt="" />
                ) : (
                  <div className="cart-missing">No image</div>
                )}
                <div className="order-detail-item-copy">
                  <h3>{item.name}</h3>
                  <p>
                    {formatCurrency(item.price)} <span aria-hidden="true">×</span> {item.quantity}
                  </p>
                </div>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </article>
            ))}
          </div>
        </section>

        <aside className="order-detail-sidebar">
          <section className="order-total-card" aria-labelledby="order-total-heading">
            <div className="order-total-heading">
              <h2 id="order-total-heading">Order summary</h2>
              <span className={`payment-state payment-state-${order.paymentStatus}`}>
                Payment: {titleCase(order.paymentStatus)}
              </span>
            </div>
            <p>
              Payment method <strong>Cash on delivery</strong>
            </p>
            <div className="order-total-divider" />
            <p className="order-grand-total">
              Total <strong>{formatCurrency(order.totalAmount)}</strong>
            </p>
          </section>

          <section className="shipping-address-card" aria-labelledby="shipping-heading">
            <p className="eyebrow">DELIVERY DETAILS</p>
            <h2 id="shipping-heading">Shipping address</h2>
            <address>
              <strong>{order.shippingAddress.fullName}</strong>
              <span>{order.shippingAddress.addressLine1}</span>
              {order.shippingAddress.addressLine2 && (
                <span>{order.shippingAddress.addressLine2}</span>
              )}
              <span>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </span>
              <span>{order.shippingAddress.country}</span>
            </address>
          </section>

          <Link className="secondary-button order-history-link" to="/orders">
            View all orders
          </Link>
        </aside>
      </div>
    </main>
  );
}
