import { formatCurrency } from '../../utils/catalog.js';

export default function ProductInformation({ product }) {
  return (
    <div className="detail-copy">
      <p className="eyebrow">{product.category?.name || 'Yoink collection'}</p>
      <h1>{product.name}</h1>
      <p className="detail-price">{formatCurrency(product.price)}</p>
      {product.numReviews > 0 && (
        <p className="rating">
          ★ {Number(product.ratingAvg).toFixed(1)} <span>from {product.numReviews} reviews</span>
        </p>
      )}
      <p className="description">{product.description}</p>
      <p className={product.stock > 0 ? 'availability' : 'availability unavailable'}>
        {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
      </p>
    </div>
  );
}
