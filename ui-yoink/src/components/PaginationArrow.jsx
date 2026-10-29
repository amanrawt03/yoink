export default function PaginationArrow({ direction }) {
  return (
    <svg className="pagination-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={direction === 'previous' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
