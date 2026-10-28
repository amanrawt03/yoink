import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

const initialAddress = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function CheckoutPage() {
  const { cart, loading, refreshCart } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const idempotencyKey = useRef(
    window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const navigate = useNavigate();
  if (loading)
    return (
      <main className="cart-page">
        <p role="status">Loading your cart…</p>
      </main>
    );
  if (!cart.items.length)
    return (
      <main className="cart-page">
        <h1>Your cart is empty</h1>
        <Link className="primary-link" to="/">
          Browse products
        </Link>
      </main>
    );
  const invalidItems = cart.items.some(
    (item) => !item.available || item.quantity > item.product.stock,
  );
  const update = (event) => setAddress({ ...address, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const order = await orderApi.createOrder(address, idempotencyKey.current);
      await refreshCart();
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to place your order. Please try again.');
      await refreshCart();
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="cart-page">
      <p className="eyebrow">CHECKOUT</p>
      <h1>Shipping details</h1>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {invalidItems && (
        <p className="notice error" role="alert">
          One or more products are unavailable or exceed current stock. Update your cart before
          checkout.
        </p>
      )}
      <div className="order-layout">
        <form className="checkout-form" onSubmit={submit}>
          {Object.entries({
            fullName: 'Full name',
            addressLine1: 'Address line 1',
            addressLine2: 'Address line 2 (optional)',
            city: 'City',
            state: 'State / province',
            postalCode: 'Postal code',
            country: 'Country',
          }).map(([name, label]) => (
            <label key={name}>
              {label}
              <input
                name={name}
                value={address[name]}
                onChange={update}
                required={name !== 'addressLine2'}
                maxLength={200}
                autoComplete={name === 'fullName' ? 'name' : undefined}
              />
            </label>
          ))}
          <button className="checkout-button" disabled={busy || invalidItems}>
            {busy ? 'Placing order…' : 'Place COD order'}
          </button>
        </form>
        <aside className="cart-summary">
          <h2>Order summary</h2>
          {cart.items.map((item) => (
            <p key={item.product?._id}>
              <span>
                {item.product?.name || 'Unavailable'} × {item.quantity}
              </span>
              <strong>{formatCurrency(item.lineSubtotal)}</strong>
            </p>
          ))}
          <p>
            Total <strong>{formatCurrency(cart.total)}</strong>
          </p>
          <p>
            Payment <strong>Cash on delivery</strong>
          </p>
          <Link to="/cart">Edit cart</Link>
        </aside>
      </div>
    </main>
  );
}
