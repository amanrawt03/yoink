import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { catalogApi, orderApi } from '../api.js';
import ProductGallery from '../components/catalog/ProductGallery.jsx';
import ProductInformation from '../components/catalog/ProductInformation.jsx';
import useProductDetails from '../hooks/useProductDetails.js';
import { EmptyState, LoadingState, NotFoundState } from '../components/PageStates.jsx';

export default function ProductDetailsPage() {
  const { idOrSlug } = useParams();
  const { product, loading, error, notFound, refresh } = useProductDetails(idOrSlug);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [cartFeedback, setCartFeedback] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
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
    let active = true;
    if (!user || !product) {
      setCanReview(false);
      setPurchaseLoading(false);
      return () => {
        active = false;
      };
    }

    setPurchaseLoading(true);
    orderApi
      .myOrders()
      .then((orders) => {
        if (active) {
          setCanReview(
            orders.some(
              (order) =>
                order.status === 'delivered' &&
                order.items.some(
                  (item) => String(item.product?._id || item.product) === String(product._id),
                ),
            ),
          );
        }
      })
      .catch(() => {
        if (active) setCanReview(false);
      })
      .finally(() => {
        if (active) setPurchaseLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?._id, product?._id]);
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
    } catch (err) {
      setCartFeedback(err.response?.data?.message || 'Unable to add this item.');
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <main className="detail-page">
        <LoadingState label="Finding your product…" />
      </main>
    );
  if (notFound) {
    return (
      <NotFoundState
        title="Product not found"
        description="This product may have sold out or is no longer available."
        action={
          <Link className="primary-link" to="/">
            Browse products
          </Link>
        }
      />
    );
  }
  if (error || !product) {
    return (
      <EmptyState
        title="Product details unavailable"
        description={error || 'We couldn’t load this product right now.'}
        action={
          <Link className="primary-link" to="/">
            Back to products
          </Link>
        }
      />
    );
  }

  return (
    <main className="detail-page">
      <section className="detail-layout">
        <ProductGallery name={product.name} images={product.images} />
        <div className="detail-panel">
          <ProductInformation product={product} />
          <div className="cart-add-control">
            <button
              className="checkout-button"
              onClick={addToCart}
              disabled={adding || product.stock < 1}
              aria-busy={adding}
            >
              Add to Cart
            </button>
            <p
              role="status"
              className={cartFeedback && !cartFeedback.startsWith('Added') ? 'error' : ''}
              aria-live="polite"
            >
              {cartFeedback || '\u00a0'}
            </p>
            {!user && <p>Log in to add items to your cart.</p>}
          </div>
        </div>
      </section>
      <section className="reviews-section" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading">Customer reviews</h2>
        <p className="rating">
          ★ {Number(product.ratingAvg || 0).toFixed(1)}{' '}
          <span>from {product.numReviews || 0} reviews</span>
        </p>
        {reviewsLoading ? (
          <LoadingState label="Loading reviews…" className="page-state-compact" />
        ) : reviewsError ? (
          <p className="notice error" role="alert">
            {reviewsError}
          </p>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Be the first verified customer to share your experience."
            className="page-state-compact"
          />
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
        {!purchaseLoading && canReview && (
          <>
            <h3>{ownReview ? 'Edit your review' : 'Write a review'}</h3>
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
            {reviewFeedback && (
              <p role="status" className={reviewFeedback.startsWith('Your') ? '' : 'error'}>
                {reviewFeedback}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
