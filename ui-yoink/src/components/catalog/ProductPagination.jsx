export default function ProductPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Product pages">
      <button disabled={page <= 1} onClick={() => onChange({ page: String(page - 1) })}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange({ page: String(page + 1) })}>Next</button>
    </nav>
  );
}
