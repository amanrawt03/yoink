import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createRazorpayOrderHandler } from '../controllers/razorpayController.js';

const shippingAddress = {
  fullName: 'Ada Lovelace',
  addressLine1: '1 Example Street',
  addressLine2: '',
  city: 'London',
  state: 'Greater London',
  postalCode: 'N1 1AA',
  country: 'United Kingdom',
};

function response() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function request() {
  return {
    user: { _id: new mongoose.Types.ObjectId() },
    body: { shippingAddress },
    get: () => 'checkout-1',
  };
}

test('Razorpay endpoint creates a pending linked order using trusted cart prices without changing inventory', async () => {
  const productId = new mongoose.Types.ObjectId();
  const cart = { items: [{ product: productId, quantity: 2 }] };
  const product = {
    _id: productId,
    name: 'Tea',
    price: 1234,
    images: ['/tea.jpg'],
    stock: 3,
    isActive: true,
  };
  let createdData;
  let createdOrderId;
  let sdkArgs;
  let productQuery;
  class FakeRazorpay {
    constructor(options) {
      assert.deepEqual(options, { key_id: 'public-key', key_secret: 'private-key' });
    }
    orders = {
      create: async (args) => {
        sdkArgs = args;
        return { id: 'order_rzp_1' };
      },
    };
  }
  const handler = createRazorpayOrderHandler({
    RazorpayClient: FakeRazorpay,
    CartModel: { findOne: async () => cart },
    ProductModel: {
      find: async (query) => {
        productQuery = query;
        return [product];
      },
    },
    OrderModel: {
      findOne: async () => null,
      create: async ([data]) => {
        createdData = data;
        createdOrderId = new mongoose.Types.ObjectId();
        return [{ ...data, _id: createdOrderId }];
      },
      findOneAndUpdate: async (filter, update) => ({
        _id: filter._id,
        ...createdData,
        razorpayOrderId: update.$set.razorpayOrderId,
      }),
    },
    getEnv: () => ({ RAZORPAY_KEY_ID: 'public-key', RAZORPAY_KEY_SECRET: 'private-key' }),
    logger: { error() {} },
  });
  const res = response();
  const req = request();
  await handler(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    applicationOrderId: createdOrderId,
    orderId: 'order_rzp_1',
    amount: 246800,
    currency: 'INR',
    keyId: 'public-key',
  });
  assert.deepEqual(sdkArgs, {
    amount: 246800,
    currency: 'INR',
    receipt: createdOrderId.toString(),
  });
  assert.equal(productQuery._id.$in[0], productId);
  assert.equal(createdData.user.toString(), req.user._id.toString());
  assert.equal(createdData.totalAmount, 2468);
  assert.equal(createdData.paymentMethod, 'razorpay');
  assert.equal(createdData.paymentStatus, 'pending');
  assert.equal(createdData.idempotencyKey, 'razorpay.checkout-1');
  assert.equal(cart.items[0].quantity, 2);
});

test('Razorpay endpoint rejects missing configuration and empty carts safely', async () => {
  const req = request();
  const missingConfig = createRazorpayOrderHandler({ getEnv: () => ({}), logger: { error() {} } });
  const configRes = response();
  await missingConfig(req, configRes);
  assert.equal(configRes.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(configRes.body), /secret/i);

  const emptyCart = createRazorpayOrderHandler({
    getEnv: () => ({ RAZORPAY_KEY_ID: 'public', RAZORPAY_KEY_SECRET: 'private' }),
    CartModel: { findOne: async () => ({ items: [] }) },
    OrderModel: { findOne: async () => null },
    logger: { error() {} },
  });
  const cartRes = response();
  await emptyCart(req, cartRes);
  assert.equal(cartRes.statusCode, 400);
  assert.match(cartRes.body.message, /cart is empty/i);
});

test('Razorpay API failures are logged and returned as safe errors', async () => {
  const errors = [];
  class FailingRazorpay {
    orders = {
      create: async () => {
        throw new Error('provider detail');
      },
    };
  }
  const handler = createRazorpayOrderHandler({
    RazorpayClient: FailingRazorpay,
    CartModel: { findOne: async () => ({ items: [{ product: 'p1', quantity: 1 }] }) },
    ProductModel: {
      find: async () => [
        { _id: 'p1', name: 'Tea', price: 10, images: ['/tea.jpg'], stock: 2, isActive: true },
      ],
    },
    OrderModel: {
      findOne: async () => null,
      create: async ([data]) => [{ ...data, _id: new mongoose.Types.ObjectId() }],
    },
    getEnv: () => ({ RAZORPAY_KEY_ID: 'public', RAZORPAY_KEY_SECRET: 'private' }),
    logger: { error: (...args) => errors.push(args) },
  });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 502);
  assert.doesNotMatch(JSON.stringify(res.body), /provider detail|private/i);
  assert.equal(errors.length, 1);
});
