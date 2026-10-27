import CatalogToolbar from '../components/catalog/CatalogToolbar.jsx';
import ProductGrid from '../components/catalog/ProductGrid.jsx';
import ProductPagination from '../components/catalog/ProductPagination.jsx';
import useProductCatalog from '../hooks/useProductCatalog.js';

export default function ProductListPage() {
  const catalog = useProductCatalog();
  const { result, loading, error, page } = catalog;

  return (
    <main className="catalog-page">
      <section className="catalog-heading">
        <div>
          <p className="eyebrow">CURATED FOR EVERYDAY</p>
          <h1>Find your next favorite.</h1>
          <p>Thoughtful essentials, made to be used and loved.</p>
        </div>
      </section>
      <CatalogToolbar {...catalog} onChange={catalog.changeParams} onSearch={catalog.submitSearch} />
      {error && <p className="notice error" role="alert">{error}</p>}
      {loading ? (
        <p className="notice">Loading products…</p>
      ) : !error && result.products.length === 0 ? (
        <p className="notice">No products found. Try another search or category.</p>
      ) : (
        <>
          <p className="result-count">{result.pagination?.total || 0} products</p>
          <ProductGrid products={result.products} />
          <ProductPagination page={page} totalPages={result.pagination?.totalPages || 0} onChange={catalog.changeParams} />
        </>
      )}
    </main>
  );
}
