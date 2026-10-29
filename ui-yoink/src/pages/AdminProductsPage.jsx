import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../api.js';
import { formatCurrency } from '../utils/catalog.js';
import { EmptyState, LoadingState } from '../components/PageStates.jsx';
import PaginationArrow from '../components/PaginationArrow.jsx';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  images: '',
  featured: false,
};
const asForm = (product) => ({
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: String(product.price),
  stock: String(product.stock),
  category: product.category?._id || product.category,
  images: product.images.join('\n'),
  featured: product.featured,
});

export default function AdminProductsPage() {
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const formDialog = useRef(null);
  const load = async () => {
    setResult(null);
    const data = await adminApi.products({ page, limit: 12 });
    setResult(data);
  };
  useEffect(() => {
    load().catch(() => setError('Unable to load products.'));
    adminApi
      .categories()
      .then(setCategories)
      .catch(() => setError('Unable to load product categories.'));
  }, [page]);
  useEffect(() => {
    const dialog = formDialog.current;
    if (!dialog) return;
    if (formOpen && !dialog.open) dialog.showModal();
    if (!formOpen && dialog.open) dialog.close();
  }, [formOpen]);
  const startEdit = (product) => {
    setEditing(product?._id || null);
    setForm(product ? asForm(product) : emptyForm);
    setFormOpen(true);
    setError('');
    setNotice('');
  };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),
    };
    try {
      if (editing) await adminApi.updateProduct(editing, payload);
      else await adminApi.createProduct(payload);
      setNotice(editing ? 'Product updated.' : 'Product created.');
      setEditing(null);
      setForm(emptyForm);
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save product.');
    } finally {
      setBusy(false);
    }
  };
  const refreshAfterProductChange = async () => {
    const data = await adminApi.products({ page, limit: 12 });
    if (data.products.length === 0 && page > 1) setPage(page - 1);
    else setResult(data);
  };
  const setActive = async (product, isActive) => {
    const action = isActive ? 'restore' : 'deactivate';
    const prompt = isActive
      ? `Restore “${product.name}” to the public catalog?`
      : `Deactivate “${product.name}”? It will no longer appear in the public catalog.`;
    if (!window.confirm(prompt)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await adminApi.updateProduct(product._id, { isActive });
      setNotice(isActive ? 'Product restored.' : 'Product deactivated.');
      await refreshAfterProductChange();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action} product.`);
    } finally {
      setBusy(false);
    }
  };
  const removeProduct = async (product) => {
    if (!window.confirm(`Permanently delete “${product.name}”? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await adminApi.deleteProduct(product._id);
      setNotice('Product permanently deleted.');
      await refreshAfterProductChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete product.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section>
      <div className="admin-section-heading">
        <h2>Products</h2>
        <button
          className="primary-link admin-add-product-button"
          aria-label="Add product"
          title="Add product"
          onClick={() => startEdit(null)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add product</span>
        </button>
      </div>
      {notice && (
        <p className="notice success" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <dialog
        className="admin-product-dialog"
        ref={formDialog}
        aria-labelledby="admin-product-dialog-title"
        onClose={() => setFormOpen(false)}
        onCancel={() => setFormOpen(false)}
      >
        <form className="admin-product-form" onSubmit={submit}>
          <div className="admin-product-form-heading">
            <h3 id="admin-product-dialog-title">{editing ? 'Edit product' : 'Create product'}</h3>
            <button
              className="admin-product-dialog-close"
              type="button"
              aria-label="Close product form"
              onClick={() => setFormOpen(false)}
            >
              ×
            </button>
          </div>
          <label>
            Name
            <input
              required
              maxLength="160"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Slug
            <input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              required
              maxLength="5000"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="admin-form-row">
            <label>
              Price
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label>
              Stock
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </label>
          </div>
          <label>
            Category
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option value={category._id} key={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Image URLs <small>One HTTP or HTTPS URL per line (up to 10).</small>
            <textarea
              required
              rows="3"
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />{' '}
            Featured
          </label>
          <div className="admin-form-actions">
            <button className="primary-link" disabled={busy}>
              {busy ? 'Saving…' : 'Save product'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
                setFormOpen(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
      {!result && !error && (
        <LoadingState label="Loading products…" className="page-state-compact" />
      )}
      {result?.products.length === 0 && (
        <EmptyState
          title="No products yet"
          description="Add a product to start building your catalog."
          className="page-state-compact"
        />
      )}
      {!!result?.products.length && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.products.map((product) => (
                <tr key={product._id}>
                  <td>
                    {product.name}
                    <small>{product.slug}</small>
                  </td>
                  <td>{product.category?.name || 'Uncategorized'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>{product.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="admin-actions">
                    <button
                      className="icon-action"
                      type="button"
                      aria-label={`Edit ${product.name}`}
                      title="Edit product"
                      onClick={() => startEdit(product)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
                      </svg>
                    </button>
                    {product.isActive ? (
                      <button
                        className="icon-action"
                        type="button"
                        aria-label={`Deactivate ${product.name}`}
                        title="Deactivate product"
                        disabled={busy}
                        onClick={() => setActive(product, false)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M8 12h8" />
                        </svg>
                      </button>
                    ) : (
                      <>
                        <button
                          className="icon-action"
                          type="button"
                          aria-label={`Restore ${product.name}`}
                          title="Restore product"
                          disabled={busy}
                          onClick={() => setActive(product, true)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 11a9 9 0 1 1 2.6 6.4M3 4v7h7" />
                          </svg>
                        </button>
                        <button
                          className="icon-action danger-action"
                          type="button"
                          aria-label={`Permanently delete ${product.name}`}
                          title="Permanently delete product"
                          disabled={busy}
                          onClick={() => removeProduct(product)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                          </svg>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result?.pagination.totalPages > 1 && (
        <div className="pagination">
          <button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <PaginationArrow direction="previous" />
          </button>
          <span>
            Page {page} of {result.pagination.totalPages}
          </span>
          <button
            aria-label="Next page"
            disabled={page >= result.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            <PaginationArrow direction="next" />
          </button>
        </div>
      )}
    </section>
  );
}
