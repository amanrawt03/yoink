import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardStats, parseAdminPagination } from '../controllers/adminController.js';
import { authorize } from '../middleware/auth.js';

test('admin pagination validates positive integers and caps page size', () => {
  assert.deepEqual(parseAdminPagination({}), { page: 1, limit: 20 });
  assert.deepEqual(parseAdminPagination({ page: '3', limit: '100' }), { page: 3, limit: 50 });
  for (const query of [{ page: '0' }, { page: '1.5' }, { limit: '-2' }, { limit: 'many' }])
    assert.throws(() => parseAdminPagination(query));
});

test('dashboard totals include every order status and revenue excludes unpaid and cancelled orders', () => {
  const stats = buildDashboardStats(12, 8, [
    { _id: 'pending', count: 2, revenue: 0 },
    { _id: 'delivered', count: 3, revenue: 90 },
    { _id: 'cancelled', count: 1, revenue: 0 },
  ]);
  assert.deepEqual(stats, {
    totalProducts: 12,
    totalUsers: 8,
    totalOrders: 6,
    ordersByStatus: { pending: 2, processing: 0, shipped: 0, delivered: 3, cancelled: 1 },
    revenue: 90,
  });
});

test('admin authorization rejects missing and non-admin users and allows admins', () => {
  const guard = authorize('admin');
  const response = () => ({
    code: 200,
    body: null,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  });
  for (const [user, expected] of [
    [null, 401],
    [{ role: 'user' }, 403],
  ]) {
    const res = response();
    guard({ user }, res, () => assert.fail('denied request must not continue'));
    assert.equal(res.code, expected);
  }
  let continued = false;
  guard({ user: { role: 'admin' } }, response(), () => {
    continued = true;
  });
  assert.equal(continued, true);
});
