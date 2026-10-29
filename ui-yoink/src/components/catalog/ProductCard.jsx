import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/catalog.js';

export default function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/products/${product.slug}`}>
      <div className="product-image-wrap">
        <img src={product.images?.[0]} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-info">
        <h2>{product.name}</h2>
        {product.numReviews > 0 && (
          <p
            className="product-card-rating"
            aria-label={`${product.ratingAvg} stars, ${product.numReviews} reviews`}
          >
            <span aria-hidden="true">★</span> {Number(product.ratingAvg).toFixed(1)}{' '}
            <span className="product-card-review-count">({product.numReviews})</span>
          </p>
        )}
        <strong>{formatCurrency(product.price)}</strong>
      </div>
    </Link>
  );
}
