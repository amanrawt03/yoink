import { useEffect, useState } from 'react';
import { catalogApi } from '../api.js';
import CatalogToolbar from '../components/catalog/CatalogToolbar.jsx';
import ProductGrid from '../components/catalog/ProductGrid.jsx';
import ProductPagination from '../components/catalog/ProductPagination.jsx';
import { EmptyState, LoadingState } from '../components/PageStates.jsx';
import useProductCatalog from '../hooks/useProductCatalog.js';

export default function ProductListPage() {
  const catalog = useProductCatalog();
  const { result, loading, error, page } = catalog;
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const heroProduct = featuredProducts[featuredIndex] || null;

  useEffect(() => {
    let active = true;
    catalogApi
      .listProducts({ featured: true, limit: 48, sortBy: 'newest' })
      .then(({ products }) => {
        if (active) setFeaturedProducts(products);
      })
      .catch(() => {
        if (active) setFeaturedProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (featuredProducts.length < 2) return undefined;
    const intervalId = window.setInterval(() => {
      setFeaturedIndex((index) => (index + 1) % featuredProducts.length);
    }, 12000);
    return () => window.clearInterval(intervalId);
  }, [featuredProducts]);

  return (
    <main className="catalog-page">
      <section className="home-hero" aria-labelledby="home-hero-title">
        {heroProduct?.images?.[0] && (
          <img className="home-hero-image" src={heroProduct.images[0]} alt="" />
        )}
        <div className="home-hero-copy">
          <p className="home-hero-kicker">NEW DROPS DAILY</p>
          <h1 id="home-hero-title">Make room for more.</h1>
          <p>Everyday essentials, priced to move fast.</p>
          <a className="home-hero-cta" href="#shop">
            Explore the collection <span aria-hidden="true">↘</span>
          </a>
        </div>
        <div className="home-hero-caption">
          <span>Enjoy the everyday</span>
          {heroProduct && <span>Featured find · {heroProduct.name}</span>}
        </div>
      </section>
      <div className="home-shop-heading" id="shop">
        <div>
          <p className="eyebrow">GOOD FINDS, RIGHT THIS WAY</p>
          <h2>Shop the collection</h2>
        </div>
        {!loading && <span>{result.pagination?.total || 0} finds</span>}
      </div>
      <CatalogToolbar
        {...catalog}
        onChange={catalog.changeParams}
        onSearch={catalog.submitSearch}
      />
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <LoadingState label="Finding good stuff…" className="page-state-compact" />
      ) : !error && result.products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try another search or choose a different category."
          className="page-state-compact"
        />
      ) : (
        <>
          <ProductGrid products={result.products} />
          <ProductPagination
            page={page}
            totalPages={result.pagination?.totalPages || 0}
            onChange={catalog.changeParams}
          />
        </>
      )}
    </main>
  );
}
