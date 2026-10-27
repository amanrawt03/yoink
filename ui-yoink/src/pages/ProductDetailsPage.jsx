import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductGallery from '../components/catalog/ProductGallery.jsx';
import ProductInformation from '../components/catalog/ProductInformation.jsx';
import useProductDetails from '../hooks/useProductDetails.js';

export default function ProductDetailsPage() {
  const { idOrSlug } = useParams();
  const { product, loading, error } = useProductDetails(idOrSlug);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [cartFeedback, setCartFeedback] = useState('');
  const addToCart = async () => {
    if (!user)
      return navigate('/login', { state: { from: { pathname: `/products/${idOrSlug}` } } });
    setAdding(true);
    setCartFeedback('');
    try {
      await addItem(product._id);
      setCartFeedback('Added to your cart.');
    } catch (err) {
      setCartFeedback(err.response?.data?.message || 'Unable to add this item.');
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <main className="detail-page">
        <p className="notice">Loading product…</p>
      </main>
    );
  if (error || !product) {
    return (
      <main className="detail-page">
        <p className="notice error" role="alert">
          {error || 'Product not found.'}
        </p>
        <Link to="/">Back to products</Link>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <Link className="back-link" to="/">
        ← All products
      </Link>
      <section className="detail-layout">
        <ProductGallery name={product.name} images={product.images} />
        <ProductInformation product={product} />
        <div className="cart-add-control">
          <button
            className="checkout-button"
            onClick={addToCart}
            disabled={adding || product.stock < 1}
          >
            {adding ? 'Adding…' : 'Add to Cart'}
          </button>
          {cartFeedback && (
            <p role="status" className={cartFeedback.startsWith('Added') ? '' : 'error'}>
              {cartFeedback}
            </p>
          )}
          {!user && <p>Log in to add items to your cart.</p>}
        </div>
      </section>
    </main>
  );
}
