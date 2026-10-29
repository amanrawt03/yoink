import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';
import { EmptyState, LoadingState } from '../components/PageStates.jsx';
import PaginationArrow from '../components/PaginationArrow.jsx';

export default function AdminUsersPage() {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  useEffect(() => {
    setResult(null);
    adminApi
      .users({ page, limit: 20 })
      .then(setResult)
      .catch(() => setError('Unable to load users.'));
  }, [page]);
  return (
    <section>
      <h2>Users</h2>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!result && !error && (
        <LoadingState label="Loading customers…" className="page-state-compact" />
      )}
      {result?.users.length === 0 && (
        <EmptyState title="No customers yet" className="page-state-compact" />
      )}
      {!!result?.users.length && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {result.users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
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
