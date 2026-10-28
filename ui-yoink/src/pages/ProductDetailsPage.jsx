import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { catalogApi } from '../api.js';
import ProductGallery from '../components/catalog/ProductGallery.jsx';
import ProductInformation from '../components/catalog/ProductInformation.jsx';
import useProductDetails from '../hooks/useProductDetails.js';

export default function ProductDetailsPage() {
  const { idOrSlug } = useParams();
  const { product, loading, error, refresh } = useProductDetails(idOrSlug);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [snatched, setSnatched] = useState(false);
  const [cartFeedback, setCartFeedback] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const ownReview = reviews.find((review) => String(review.user) === String(user?._id));
  const loadReviews = async () => {
    setReviewsLoading(true);
    setReviewsError('');
    setReviews([]);
    try {
      setReviews(await catalogApi.getReviews(idOrSlug));
    } catch (err) {
      setReviewsError(err.response?.data?.message || 'Reviews could not be loaded.');
    } finally {
      setReviewsLoading(false);
    }
  };
  useEffect(() => {
    loadReviews();
  }, [idOrSlug]);
  useEffect(() => {
    if (ownReview) {
      setRating(String(ownReview.rating));
      setComment(ownReview.comment);
    } else {
      setRating('5');
      setComment('');
    }
  }, [ownReview?._id]);
  const saveReview = async (event) => {
    event.preventDefault();
    if (!user)
      return navigate('/login', { state: { from: { pathname: `/products/${idOrSlug}` } } });
    setReviewBusy(true);
    setReviewFeedback('');
    try {
      if (ownReview)
        await catalogApi.updateReview(ownReview._id, { rating: Number(rating), comment });
      else await catalogApi.createReview(idOrSlug, { rating: Number(rating), comment });
      await Promise.all([loadReviews(), refresh()]);
      setReviewFeedback('Your review has been saved.');
    } catch (err) {
      setReviewFeedback(err.response?.data?.message || 'Unable to save your review.');
    } finally {
      setReviewBusy(false);
    }
  };
  const removeReview = async () => {
    if (!ownReview) return;
    setReviewBusy(true);
    setReviewFeedback('');
    try {
      await catalogApi.deleteReview(ownReview._id);
      await Promise.all([loadReviews(), refresh()]);
      setReviewFeedback('Your review has been deleted.');
    } catch (err) {
      setReviewFeedback(err.response?.data?.message || 'Unable to delete your review.');
    } finally {
      setReviewBusy(false);
    }
  };
  const addToCart = async () => {
    if (!user)
      return navigate('/login', { state: { from: { pathname: `/products/${idOrSlug}` } } });
    setAdding(true);
    setCartFeedback('');
    try {
      await addItem(product._id);
      setCartFeedback('Added to your cart.');
      setSnatched(true);
      window.setTimeout(() => setSnatched(false), 250);
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
            className={`checkout-button${snatched ? ' snatch' : ''}`}
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
      <section className="reviews-section" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading">Customer reviews</h2>
        <p className="rating">
          ★ {Number(product.ratingAvg || 0).toFixed(1)}{' '}
          <span>from {product.numReviews || 0} reviews</span>
        </p>
        {reviewsLoading ? (
          <p role="status">Loading reviews…</p>
        ) : reviewsError ? (
          <p className="notice error" role="alert">
            {reviewsError}
          </p>
        ) : reviews.length === 0 ? (
          <p className="notice">No reviews yet.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((review) => (
              <li className="review-card" key={review._id}>
                <div className="review-heading">
                  <strong>{review.reviewerName}</strong>
                  <span aria-label={`${review.rating} out of 5 stars`}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <p>{review.comment}</p>
                <time dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
        <h3>{ownReview ? 'Edit your review' : 'Write a review'}</h3>
        {!user ? (
          <p>
            <Link to="/login" state={{ from: { pathname: `/products/${idOrSlug}` } }}>
              Log in
            </Link>{' '}
            to review this product.
          </p>
        ) : (
          <form className="review-form" onSubmit={saveReview}>
            <label>
              Rating{' '}
              <select value={rating} onChange={(event) => setRating(event.target.value)}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option value={value} key={value}>
                    {value} star{value > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Comment{' '}
              <textarea
                required
                maxLength={2000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <div className="review-actions">
              <button className="checkout-button" disabled={reviewBusy || !comment.trim()}>
                {reviewBusy ? 'Saving…' : ownReview ? 'Update review' : 'Submit review'}
              </button>
              {ownReview && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={reviewBusy}
                  onClick={removeReview}
                >
                  Delete review
                </button>
              )}
            </div>
          </form>
        )}
        {reviewFeedback && (
          <p role="status" className={reviewFeedback.startsWith('Your') ? '' : 'error'}>
            {reviewFeedback}
          </p>
        )}
      </section>
    </main>
  );
}
