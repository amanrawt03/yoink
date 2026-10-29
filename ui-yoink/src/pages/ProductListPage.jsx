import CatalogToolbar from '../components/catalog/CatalogToolbar.jsx';
import ProductGrid from '../components/catalog/ProductGrid.jsx';
import ProductPagination from '../components/catalog/ProductPagination.jsx';
import useProductCatalog from '../hooks/useProductCatalog.js';

export default function ProductListPage() {
  const catalog = useProductCatalog();
  const { result, loading, error, page, categories, category } = catalog;
  const heroProduct = result.products[0];

  return (
    <main className="catalog-page">
      <section className="home-hero" aria-labelledby="home-hero-title">
        {heroProduct?.images?.[0] && (
          <img className="home-hero-image" src={heroProduct.images[0]} alt="" />
        )}
        <div className="home-hero-copy">
          <p className="home-hero-kicker">THE EVERYDAY EDIT</p>
          <h1 id="home-hero-title">Good things.<br />Better finds.</h1>
          <p>Thoughtful essentials for the things you do every day.</p>
          <a className="home-hero-cta" href="#shop">Explore the collection <span aria-hidden="true">↘</span></a>
        </div>
        <div className="home-hero-caption">
          <span>Enjoy the everyday</span>
          {heroProduct && <span>Featured find · {heroProduct.name}</span>}
        </div>
      </section>
      <section className="home-category-section" aria-label="Shop by category">
        <div className="home-category-heading">
          <p className="eyebrow">A LITTLE BIT OF EVERYTHING</p>
          <h2>Find your kind of good.</h2>
        </div>
        <div className="home-category-list">
          <button className={!category ? 'active' : ''} type="button" onClick={() => catalog.changeParams({ category: '' })}>Everything <span>↗</span></button>
          {categories.map((item) => (
            <button className={category === item._id ? 'active' : ''} key={item._id} type="button" onClick={() => catalog.changeParams({ category: item._id })}>
              {item.name} <span>↗</span>
            </button>
          ))}
        </div>
      </section>
      <div className="home-shop-heading" id="shop">
        <div><p className="eyebrow">GOOD FINDS, RIGHT THIS WAY</p><h2>Shop the collection</h2></div>
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
        <p className="notice">Loading products…</p>
      ) : !error && result.products.length === 0 ? (
        <p className="notice">No products found. Try another search or category.</p>
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
