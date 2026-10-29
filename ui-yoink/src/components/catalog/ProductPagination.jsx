import PaginationArrow from '../PaginationArrow.jsx';

export default function ProductPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Product pages">
      <button
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange({ page: String(page - 1) })}
      >
        <PaginationArrow direction="previous" />
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange({ page: String(page + 1) })}
      >
        <PaginationArrow direction="next" />
      </button>
    </nav>
  );
}
