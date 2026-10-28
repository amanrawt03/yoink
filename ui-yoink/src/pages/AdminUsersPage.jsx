import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';

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
      {!result && !error && <p role="status">Loading users…</p>}
      {result?.users.length === 0 && <p className="notice">No users found.</p>}
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
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {result.pagination.totalPages}
          </span>
          <button disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
}
