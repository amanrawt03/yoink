import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/catalog.js';
import { EmptyState, LoadingState } from '../components/PageStates.jsx';

export default function CartPage() {
  const { cart, loading, error, updateItem, removeItem } = useCart();
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  const perform = async (key, action) => {
    setBusy(key);
    setActionError('');
    try {
      await action();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update your cart.');
    } finally {
      setBusy('');
    }
  };
  if (loading)
    return (
      <main className="cart-page">
        <LoadingState label="Loading your cart…" />
      </main>
    );
  return (
    <main className="cart-page">
      {!!cart.items.length && <h1>Your cart</h1>}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {actionError && (
        <p className="notice error" role="alert">
          {actionError}
        </p>
      )}
      {!cart.items.length ? (
        <EmptyState
          title="Your cart is empty"
          description="Find something useful, fun, or a little bit of both."
          action={
            <Link className="primary-link" to="/">
              Browse products
            </Link>
          }
        />
      ) : (
        <>
          <div className="cart-layout">
            <div className="cart-items">
              {cart.items.map((item) => {
                const product = item.product;
                const id = product?._id;
                return (
                  <article className="cart-item" key={id || `removed-${item.quantity}`}>
                    {product?.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="cart-missing">Unavailable</div>
                    )}
                    <div className="cart-item-info">
                      <h2>{product?.name || 'Product no longer available'}</h2>
                      {!item.available && <p className="error">Unavailable for purchase</p>}
                      <p>{product ? formatCurrency(product.price) : 'Price unavailable'} each</p>
                      <strong>Line subtotal: {formatCurrency(item.lineSubtotal)}</strong>
                    </div>
                    <div className="cart-actions">
                      {id && (
                        <div className="quantity-control">
                          <button
                            aria-label={`Decrease ${product.name} quantity`}
                            disabled={busy === id || item.quantity <= 1}
                            onClick={() => perform(id, () => updateItem(id, item.quantity - 1))}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={`Increase ${product.name} quantity`}
                            disabled={
                              busy === id || !item.available || item.quantity >= product.stock
                            }
                            onClick={() => perform(id, () => updateItem(id, item.quantity + 1))}
                          >
                            +
                          </button>
                        </div>
                      )}
                      <button
                        className="text-button"
                        disabled={busy === (id || 'removed')}
                        onClick={() =>
                          perform(id || 'removed', () => (id ? removeItem(id) : Promise.resolve()))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <aside className="cart-summary">
              <p>
                Subtotal <strong>{formatCurrency(cart.subtotal)}</strong>
              </p>
              <p>
                Total <strong>{formatCurrency(cart.total)}</strong>
              </p>
              <Link
                className={`checkout-button${cart.items.some((item) => !item.available) ? ' disabled-link' : ''}`}
                aria-disabled={cart.items.some((item) => !item.available)}
                onClick={(event) => {
                  if (cart.items.some((item) => !item.available)) event.preventDefault();
                }}
                to="/checkout"
              >
                Proceed to Checkout
              </Link>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
