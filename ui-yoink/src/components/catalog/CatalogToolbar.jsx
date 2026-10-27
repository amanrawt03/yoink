export default function CatalogToolbar({ search, setSearch, categories, category, sortBy, order, onSearch, onChange }) {
  const sortValue = sortBy === 'price' ? (order === 'asc' ? 'price-asc' : 'price-desc') : sortBy;

  function changeSort(event) {
    const [by, direction] = event.target.value.split('-');
    onChange({ sortBy: by, order: direction || 'desc' });
  }

  return (
    <section className="catalog-controls" aria-label="Product filters">
      <form className="search-form" onSubmit={onSearch}>
        <input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
        <button type="submit">Search</button>
      </form>
      <select aria-label="Filter by category" value={category} onChange={(event) => onChange({ category: event.target.value })}>
        <option value="">All categories</option>
        {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
      </select>
      <select aria-label="Sort products" value={sortValue} onChange={changeSort}>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Top rated</option>
      </select>
    </section>
  );
}
