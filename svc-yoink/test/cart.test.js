import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { responseCart, validateCartQuantity } from '../controllers/cartController.js';

test('cart quantities must be positive integers', () => {
  for (const quantity of [1, 2, 999]) assert.equal(validateCartQuantity(quantity), true);
  for (const quantity of [0, -1, 1.2, '2', null, undefined])
    assert.equal(validateCartQuantity(quantity), false);
});

test('cart totals use current product prices and missing/deactivated products remain removable', () => {
  const productId = new mongoose.Types.ObjectId();
  const removedId = new mongoose.Types.ObjectId();
  const cart = responseCart({
    items: [
      {
        product: {
          _id: productId,
          name: 'Current item',
          images: ['/item.jpg'],
          price: 12.5,
          stock: 4,
          isActive: true,
        },
        quantity: 2,
      },
      { product: { _id: removedId, isActive: false, stock: 0 }, quantity: 3 },
    ],
  });
  assert.equal(cart.subtotal, 25);
  assert.equal(cart.total, 25);
  assert.equal(cart.items[0].lineSubtotal, 25);
  assert.equal(cart.items[1].available, false);
  assert.equal(cart.items[1].product._id, removedId);
});

test('missing cart serializes consistently as an empty cart', () => {
  assert.deepEqual(responseCart(null), { items: [], subtotal: 0, total: 0 });
});
