import test from 'node:test';
import assert from 'node:assert/strict';
import { publicUser } from '../controllers/authController.js';

test('public user response includes the ID used by the review UI without exposing credentials', () => {
  const user = publicUser({
    _id: 'user-id',
    name: 'Ada',
    email: 'ada@example.com',
    role: 'user',
    passwordHash: 'secret-hash',
  });
  assert.equal(user._id, 'user-id');
  assert.equal(user.id, 'user-id');
  assert.equal(Object.hasOwn(user, 'passwordHash'), false);
});
