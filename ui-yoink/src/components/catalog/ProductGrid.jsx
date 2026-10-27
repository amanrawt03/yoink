import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products }) {
  return (
    <section className="product-grid" aria-label="Products">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </section>
  );
}
