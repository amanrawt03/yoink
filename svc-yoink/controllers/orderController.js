import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const addressFields = [
  'fullName',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
];

export function validShippingAddress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return addressFields.every((field) => {
    if (field === 'addressLine2')
      return value[field] === undefined || typeof value[field] === 'string';
    return (
      typeof value[field] === 'string' &&
      value[field].trim().length > 0 &&
      value[field].trim().length <= 200
    );
  });
}

export async function createOrder(req, res, next) {
  const key = req.get('Idempotency-Key');
  if (!key || key.length > 128 || !/^[\w.-]+$/.test(key))
    return res
      .status(400)
      .json({
        message:
          'A valid Idempotency-Key header is required (up to 128 letters, numbers, dots, underscores, or hyphens).',
      });
  if (!validShippingAddress(req.body?.shippingAddress))
    return res
      .status(400)
      .json({
        message:
          'Shipping address must include fullName, addressLine1, city, state, postalCode, and country.',
      });

  const address = Object.fromEntries(
    addressFields.map((field) => [field, (req.body.shippingAddress[field] || '').trim()]),
  );
  let session;
  try {
    if (key) {
      const existing = await Order.findOne({ user: req.user._id, idempotencyKey: key });
      if (existing) return res.status(200).json({ order: existing, reused: true });
    }
    session = await mongoose.startSession();
    let created;
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user._id }).session(session);
      if (!cart?.items.length) {
        const error = new Error('Your cart is empty.');
        error.status = 400;
        throw error;
      }
      const ids = cart.items.map((item) => item.product);
      const products = await Product.find({ _id: { $in: ids } }).session(session);
      const byId = new Map(products.map((product) => [product._id.toString(), product]));
      const snapshots = [];
      let totalAmount = 0;
      for (const item of cart.items) {
        const product = byId.get(item.product.toString());
        if (!product || !product.isActive) {
          const error = new Error('A product in your cart is no longer available.');
          error.status = 409;
          throw error;
        }
        if (
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > product.stock
        ) {
          const error = new Error(`Insufficient stock for ${product.name}.`);
          error.status = 409;
          throw error;
        }
        const lineTotal = product.price * item.quantity;
        totalAmount += lineTotal;
        snapshots.push({
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: item.quantity,
        });
      }
      for (const item of cart.items) {
        const result = await Product.updateOne(
          { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        );
        if (result.modifiedCount !== 1) {
          const error = new Error(
            'Stock changed during checkout. Please review your cart and try again.',
          );
          error.status = 409;
          throw error;
        }
      }
      const [order] = await Order.create(
        [
          {
            user: req.user._id,
            items: snapshots,
            shippingAddress: address,
            totalAmount,
            status: 'pending',
            paymentStatus: 'pending',
            idempotencyKey: key,
          },
        ],
        { session },
      );
      const cleared = await Cart.updateOne(
        { _id: cart._id, user: req.user._id },
        { $set: { items: [] } },
        { session },
      );
      if (cleared.modifiedCount !== 1) {
        const error = new Error('Cart changed during checkout. Please try again.');
        error.status = 409;
        throw error;
      }
      created = order;
    });
    return res.status(201).json({ order: created });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === 11000 && key) {
      const existing = await Order.findOne({ user: req.user._id, idempotencyKey: key });
      if (existing) return res.status(200).json({ order: existing, reused: true });
    }
    if (
      /Transaction numbers are only allowed|replica set|mongos|does not support transactions/i.test(
        error.message || '',
      )
    )
      return res
        .status(503)
        .json({
          message:
            'Checkout requires MongoDB transaction support. Configure MongoDB as a replica set or Atlas cluster and retry.',
        });
    return next(error);
  } finally {
    await session?.endSession();
  }
}

export async function getMyOrders(req, res, next) {
  try {
    return res.json({ orders: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }) });
  } catch (error) {
    return next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
      return res.status(400).json({ message: 'Order ID is invalid.' });
    const filter = {
      _id: req.params.id,
      ...(req.user.role === 'admin' ? {} : { user: req.user._id }),
    };
    const order = await Order.findOne(filter);
    return order ? res.json({ order }) : res.status(404).json({ message: 'Order not found.' });
  } catch (error) {
    return next(error);
  }
}

export async function getAllOrders(_req, res, next) {
  try {
    return res.json({ orders: await Order.find().sort({ createdAt: -1 }) });
  } catch (error) {
    return next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id))
      return res.status(400).json({ message: 'Order ID is invalid.' });
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(req.body?.status))
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}.` });
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true, runValidators: true },
    );
    return order ? res.json({ order }) : res.status(404).json({ message: 'Order not found.' });
  } catch (error) {
    return next(error);
  }
}
