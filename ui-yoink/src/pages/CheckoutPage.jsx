import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { accountApi, orderApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      script.remove();
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

const emptyAddress = (name = '') => ({
  label: 'Home',
  fullName: name,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
});

export default function CheckoutPage() {
  const { cart, loading, refreshCart } = useCart();
  const { user, refreshUser } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState(() => user?.savedAddresses || []);
  const [defaultAddressId, setDefaultAddressId] = useState(() =>
    String(user?.defaultAddressId || user?.savedAddresses?.[0]?._id || ''),
  );
  const [selectedAddressId, setSelectedAddressId] = useState(() =>
    String(user?.defaultAddressId || user?.savedAddresses?.[0]?._id || ''),
  );
  const [useNewAddress, setUseNewAddress] = useState(() => !user?.savedAddresses?.length);
  const [address, setAddress] = useState(() => emptyAddress(user?.name));
  const [saveAddress, setSaveAddress] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [addressBusy, setAddressBusy] = useState(false);
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');
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
  const activeSavedAddress = savedAddresses.find(
    (saved) => String(saved._id) === String(selectedAddressId),
  );
  const update = (event) =>
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateSavedAddresses = async (response) => {
    setSavedAddresses(response.savedAddresses);
    setDefaultAddressId(String(response.defaultAddressId || ''));
    await refreshUser();
  };

  const chooseNewAddress = () => {
    setUseNewAddress(true);
    setAddressError('');
    setAddress((current) => ({ ...current, fullName: current.fullName || user?.name || '' }));
  };

  const setDefault = async (addressId) => {
    setAddressBusy(true);
    setAddressError('');
    try {
      const response = await accountApi.makeDefaultAddress(addressId);
      await updateSavedAddresses(response);
      setSelectedAddressId(String(addressId));
      setUseNewAddress(false);
    } catch (err) {
      setAddressError(err.response?.data?.message || 'Could not update your default address.');
    } finally {
      setAddressBusy(false);
    }
  };

  const removeAddress = async (addressId) => {
    setAddressBusy(true);
    setAddressError('');
    try {
      const response = await accountApi.deleteAddress(addressId);
      await updateSavedAddresses(response);
      if (!response.savedAddresses.length) setUseNewAddress(true);
      if (String(selectedAddressId) === String(addressId)) {
        setSelectedAddressId(
          String(response.defaultAddressId || response.savedAddresses[0]?._id || ''),
        );
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || 'Could not remove this saved address.');
    } finally {
      setAddressBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setPaymentNotice('');
    setAddressError('');
    setBusy(true);
    let paymentWindowOpened = false;
    try {
      let shippingAddress = activeSavedAddress;
      if (useNewAddress) {
        shippingAddress = address;
        if (saveAddress) {
          const response = await accountApi.addAddress(address);
          await updateSavedAddresses(response);
          shippingAddress = response.address;
          setSelectedAddressId(String(response.address._id));
          setUseNewAddress(false);
          setSaveAddress(false);
        }
      }
      if (paymentMethod === 'cod') {
        const order = await orderApi.createOrder(shippingAddress, idempotencyKey.current);
        await refreshCart();
        navigate(`/orders/${order._id}`, { replace: true });
        return;
      }

      const paymentOrder = await orderApi.createRazorpayOrder(
        shippingAddress,
        idempotencyKey.current,
      );
      if (!(await loadRazorpayCheckout()))
        throw new Error('Could not load Razorpay Checkout. Please try again.');

      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Yoink',
        description: 'Order payment',
        order_id: paymentOrder.orderId,
        handler: async (paymentResponse) => {
          try {
            await orderApi.verifyRazorpayPayment({
              ...paymentResponse,
              applicationOrderId: paymentOrder.applicationOrderId,
            });
            await refreshCart();
            setBusy(false);
            navigate(`/orders/${paymentOrder.applicationOrderId}`, { replace: true });
          } catch (verifyError) {
            setBusy(false);
            setError(
              verifyError.response?.data?.message ||
                'Razorpay reported success, but payment verification failed. Please contact support before retrying.',
            );
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setPaymentNotice(
              'Payment was cancelled. No payment has been confirmed; you can retry this checkout.',
            );
          },
        },
      });
      checkout.on('payment.failed', (response) => {
        setBusy(false);
        setError(
          response.error?.description ||
            'Razorpay could not complete the payment. No payment has been confirmed.',
        );
      });
      checkout.open();
      paymentWindowOpened = true;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to place your order. Please try again.');
      if (paymentMethod === 'cod') await refreshCart();
    } finally {
      if (!paymentWindowOpened) setBusy(false);
    }
  };

  return (
    <main className="cart-page checkout-page">
      <p className="eyebrow">CHECKOUT</p>
      <h1>Where should we send it?</h1>
      <p className="checkout-intro">Choose a saved address or add a new delivery spot.</p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {paymentNotice && (
        <p className="notice" role="status">
          {paymentNotice}
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
          {savedAddresses.length > 0 && (
            <fieldset className="saved-addresses">
              <legend>Saved addresses</legend>
              <div className="saved-address-list">
                {savedAddresses.map((saved) => (
                  <div
                    className={`saved-address${!useNewAddress && String(selectedAddressId) === String(saved._id) ? ' selected' : ''}`}
                    key={saved._id}
                  >
                    <label className="saved-address-choice">
                      <input
                        type="radio"
                        name="savedAddress"
                        value={saved._id}
                        checked={!useNewAddress && String(selectedAddressId) === String(saved._id)}
                        onChange={() => {
                          setUseNewAddress(false);
                          setSelectedAddressId(String(saved._id));
                        }}
                      />
                      <span className="saved-address-copy">
                        <strong>
                          {saved.label || 'Address'}
                          {String(saved._id) === defaultAddressId && (
                            <span className="default-tag">Default</span>
                          )}
                        </strong>
                        <span>{saved.fullName}</span>
                        <span>
                          {saved.addressLine1}
                          {saved.addressLine2 ? `, ${saved.addressLine2}` : ''}
                        </span>
                        <span>
                          {saved.city}, {saved.state} {saved.postalCode}
                        </span>
                        <span>{saved.country}</span>
                      </span>
                    </label>
                    <span className="saved-address-actions">
                      {String(saved._id) !== defaultAddressId && (
                        <button
                          type="button"
                          disabled={addressBusy || busy}
                          onClick={() => setDefault(saved._id)}
                        >
                          Make default
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={addressBusy || busy}
                        onClick={() => removeAddress(saved._id)}
                      >
                        Remove
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {savedAddresses.length > 0 && !useNewAddress ? (
            <button className="new-address-toggle" type="button" onClick={chooseNewAddress}>
              + Use a different address
            </button>
          ) : (
            <section className="new-address-section">
              <div className="new-address-heading">
                <h2>{savedAddresses.length ? 'Add a different address' : 'Delivery address'}</h2>
                {savedAddresses.length > 0 && (
                  <button type="button" onClick={() => setUseNewAddress(false)}>
                    Choose saved address
                  </button>
                )}
              </div>
              <div className="address-fields">
                <label className="address-label-field">
                  Address label
                  <input
                    name="label"
                    value={address.label}
                    onChange={update}
                    maxLength={40}
                    placeholder="Home or work"
                  />
                </label>
                {Object.entries({
                  fullName: 'Full name',
                  addressLine1: 'Address line 1',
                  addressLine2: 'Address line 2 (optional)',
                  city: 'City',
                  state: 'State / province',
                  postalCode: 'Postal code',
                  country: 'Country',
                }).map(([name, label]) => (
                  <label
                    key={name}
                    className={
                      name === 'addressLine1' || name === 'addressLine2' ? 'address-wide' : ''
                    }
                  >
                    {label}
                    <input
                      name={name}
                      value={address[name]}
                      onChange={update}
                      required={name !== 'addressLine2'}
                      maxLength={200}
                      autoComplete={
                        name === 'fullName'
                          ? 'name'
                          : name === 'postalCode'
                            ? 'postal-code'
                            : undefined
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="save-address-option">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                />
                Save this address to my account for next time
              </label>
            </section>
          )}
          {addressError && (
            <p className="notice error" role="alert">
              {addressError}
            </p>
          )}
          <fieldset className="checkout-payment-methods">
            <legend>Payment method</legend>
            <label
              className={paymentMethod === 'cod' ? 'payment-option selected' : 'payment-option'}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <span>
                <strong>Cash on delivery</strong>
                <small>Pay when your order arrives.</small>
              </span>
            </label>
            <label
              className={
                paymentMethod === 'razorpay' ? 'payment-option selected' : 'payment-option'
              }
            >
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === 'razorpay'}
                onChange={() => setPaymentMethod('razorpay')}
              />
              <span>
                <strong>Pay online</strong>
                <small>Continue securely with Razorpay.</small>
              </span>
            </label>
          </fieldset>
          <button
            className="checkout-button place-order-button"
            disabled={
              busy || addressBusy || invalidItems || (!useNewAddress && !activeSavedAddress)
            }
          >
            {busy
              ? paymentMethod === 'razorpay'
                ? 'Opening Razorpay…'
                : 'Placing order…'
              : paymentMethod === 'razorpay'
                ? 'Continue to Razorpay'
                : 'Place COD order'}
          </button>
        </form>
        <aside className="cart-summary">
          <h2>Order summary</h2>
          {cart.items.map((item) => (
            <p className="cart-summary-item" key={item.product?._id}>
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
            Payment{' '}
            <strong>{paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on delivery'}</strong>
          </p>
          <Link className="secondary-button edit-cart-button" to="/cart">
            Edit cart
          </Link>
        </aside>
      </div>
    </main>
  );
}
