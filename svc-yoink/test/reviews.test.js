import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { listReviews, reviewResponse, validateReview } from '../controllers/reviewController.js';

test('reviews require integer ratings from one through five and nonempty bounded comments', () => {
  const valid = { rating: 5, comment: 'Very good.' };
  assert.equal(validateReview(valid), null);
  for (const rating of [0, 6, 1.5, '5', null])
    assert.match(validateReview({ ...valid, rating }), /Rating/);
  for (const comment of ['', '  ', null, 'x'.repeat(2001)])
    assert.match(validateReview({ ...valid, comment }), /Comment/);
  assert.match(validateReview({ rating: 3 }), /Comment/);
  assert.match(validateReview({ comment: 'Good' }), /Rating/);
});

test('review updates require at least one valid field', () => {
  assert.equal(validateReview({ rating: 4 }, { partial: true }), null);
  assert.equal(validateReview({ comment: 'Edited' }, { partial: true }), null);
  assert.match(validateReview({}, { partial: true }), /update/);
});

test('review schema enforces a unique user/product pair and rating/comment constraints', async () => {
  const pairIndex = Review.schema
    .indexes()
    .find(([keys, options]) => keys.user === 1 && keys.product === 1 && options.unique);
  assert.ok(pairIndex, 'unique user/product index exists');
  const review = new Review({
    user: new mongoose.Types.ObjectId(),
    product: new mongoose.Types.ObjectId(),
    rating: 5,
    comment: 'Nice',
  });
  await assert.doesNotReject(review.validate());
  review.rating = 3.2;
  await assert.rejects(review.validate());
  review.rating = 5;
  review.comment = '  ';
  await assert.rejects(review.validate());
});

test('safe review response exposes display data and no user email or credential fields', () => {
  const safe = reviewResponse({
    _id: 'review-id',
    user: { _id: 'user-id', name: 'Ada', email: 'private@example.com', passwordHash: 'secret' },
    rating: 4,
    comment: 'Solid',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
  });
  assert.deepEqual(
    Object.keys(safe).sort(),
    ['_id', 'comment', 'createdAt', 'rating', 'reviewerName', 'updatedAt', 'user'].sort(),
  );
  assert.equal(safe.reviewerName, 'Ada');
  assert.equal(safe.rating, 4);
  assert.equal(Object.hasOwn(safe, 'email'), false);
  assert.equal(Object.hasOwn(safe, 'passwordHash'), false);
});

test('review write protection rejects an unauthenticated request before database access', async () => {
  let status;
  let payload;
  const response = {
    status(code) {
      status = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };
  await protect({ get: () => undefined, headers: {} }, response, () =>
    assert.fail('must not call next'),
  );
  assert.equal(status, 401);
  assert.equal(payload.message, 'Authentication required.');
});

test('public review retrieval returns not found for missing or inactive products', async () => {
  const originalFindOne = Product.findOne;
  try {
    for (const idOrSlug of ['507f1f77bcf86cd799439011', 'inactive-item']) {
      Product.findOne = () => ({ select: () => ({ lean: async () => null }) });
      let status;
      let payload;
      const response = {
        status(code) {
          status = code;
          return this;
        },
        json(body) {
          payload = body;
          return this;
        },
      };
      await listReviews({ params: { idOrSlug } }, response, assert.fail);
      assert.equal(status, 404);
      assert.equal(payload.message, 'Product not found.');
    }
  } finally {
    Product.findOne = originalFindOne;
  }
});
