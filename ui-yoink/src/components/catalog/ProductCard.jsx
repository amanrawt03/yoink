import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/catalog.js';

export default function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/products/${product.slug}`}>
      <div className="product-image-wrap">
        <img src={product.images?.[0]} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-info">
        <div>
          <h2>{product.name}</h2>
          <p>{product.category?.name}</p>
        </div>
        <strong>{formatCurrency(product.price)}</strong>
      </div>
      {product.numReviews > 0 && (
        <p className="rating">
          ★ {Number(product.ratingAvg).toFixed(1)} <span>({product.numReviews})</span>
        </p>
      )}
    </Link>
  );
}
