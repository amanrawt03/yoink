import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { validShippingAddress } from '../controllers/orderController.js';

const shippingAddress = {
  fullName: 'Ada Lovelace',
  addressLine1: '1 Example Street',
  addressLine2: '',
  city: 'London',
  state: 'Greater London',
  postalCode: 'N1 1AA',
  country: 'United Kingdom',
};

test('shipping address follows the checkout schema and allows an optional second line', () => {
  assert.equal(validShippingAddress(shippingAddress), true);
  assert.equal(validShippingAddress({ ...shippingAddress, addressLine2: undefined }), true);
  assert.equal(validShippingAddress({ ...shippingAddress, city: '  ' }), false);
  assert.equal(validShippingAddress({ ...shippingAddress, country: 42 }), false);
  assert.equal(validShippingAddress(null), false);
});

test('order schema limits statuses and requires historical item snapshots with pending payment by default', async () => {
  const order = new Order({
    user: new mongoose.Types.ObjectId(),
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        name: 'Example',
        price: 12,
        image: '/item.jpg',
        quantity: 2,
      },
    ],
    shippingAddress,
    totalAmount: 24,
  });
  assert.equal(order.paymentStatus, 'pending');
  assert.equal(order.status, 'pending');
  await assert.doesNotReject(order.validate());
  order.status = 'unknown';
  await assert.rejects(order.validate(), /`unknown` is not a valid enum value/);
});
