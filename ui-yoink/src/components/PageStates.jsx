export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={`page-state page-state-loading ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="page-state-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, description, action, className = '' }) {
  return (
    <section className={`page-state page-state-empty ${className}`.trim()}>
      <span className="page-state-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="m7 15 17-9 17 9v20l-17 9-17-9V15Z" />
          <path d="m7 15 17 10 17-10M24 25v19M15 10l17 10" />
        </svg>
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="page-state-action">{action}</div>}
    </section>
  );
}

export function NotFoundState({ title = 'Page not found', description, action }) {
  return (
    <main className="page-state page-state-not-found">
      <span className="page-state-code" aria-hidden="true">
        404
      </span>
      <h1>{title}</h1>
      <p>{description || 'We couldn’t find what you were looking for.'}</p>
      {action && <div className="page-state-action">{action}</div>}
    </main>
  );
}
