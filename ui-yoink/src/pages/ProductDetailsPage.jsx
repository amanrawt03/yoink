import { Link, useParams } from 'react-router-dom';
import ProductGallery from '../components/catalog/ProductGallery.jsx';
import ProductInformation from '../components/catalog/ProductInformation.jsx';
import useProductDetails from '../hooks/useProductDetails.js';

export default function ProductDetailsPage() {
  const { idOrSlug } = useParams();
  const { product, loading, error } = useProductDetails(idOrSlug);

  if (loading) return <main className="detail-page"><p className="notice">Loading product…</p></main>;
  if (error || !product) {
    return (
      <main className="detail-page">
        <p className="notice error" role="alert">{error || 'Product not found.'}</p>
        <Link to="/">Back to products</Link>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <Link className="back-link" to="/">← All products</Link>
      <section className="detail-layout">
        <ProductGallery name={product.name} images={product.images} />
        <ProductInformation product={product} />
      </section>
    </main>
  );
}
