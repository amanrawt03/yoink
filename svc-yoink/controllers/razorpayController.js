import { createHmac, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { validShippingAddress } from './orderController.js';

export function validIdempotencyKey(key) {
  return typeof key === 'string' && key.length <= 128 && /^[\w.-]+$/.test(key);
}

export function createRazorpayOrderHandler({
  RazorpayClient = Razorpay,
  CartModel = Cart,
  OrderModel = Order,
  ProductModel = Product,
  getEnv = () => process.env,
  logger = console,
} = {}) {
  return async function createRazorpayOrder(req, res) {
    const key = req.get('Idempotency-Key');
    if (!validIdempotencyKey(key))
      return res.status(400).json({ message: 'A valid Idempotency-Key header is required.' });
    if (!validShippingAddress(req.body?.shippingAddress))
      return res.status(400).json({ message: 'A valid shipping address is required.' });

    const env = getEnv();
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      logger.error('Razorpay order creation unavailable: Razorpay credentials are not configured.');
      return res.status(503).json({ message: 'Online payments are temporarily unavailable.' });
    }

    const appKey = `razorpay.${key}`;
    try {
      let order = await OrderModel.findOne({ user: req.user._id, idempotencyKey: appKey });
      if (order?.razorpayOrderId) {
        const existingAmount = Math.round(order.totalAmount * 100);
        if (!Number.isSafeInteger(existingAmount) || existingAmount <= 0)
          return res.status(409).json({ message: 'This payment order is no longer valid.' });
        return res.json({
          applicationOrderId: order._id,
          orderId: order.razorpayOrderId,
          amount: existingAmount,
          currency: 'INR',
          keyId: env.RAZORPAY_KEY_ID,
        });
      }

      let snapshots;
      let amount = 0;
      if (!order) {
        const cart = await CartModel.findOne({ user: req.user._id });
        if (!cart?.items?.length) return res.status(400).json({ message: 'Your cart is empty.' });
        const products = await ProductModel.find({
          _id: { $in: cart.items.map((item) => item.product) },
        });
        const byId = new Map(products.map((product) => [product._id.toString(), product]));
        snapshots = [];
        for (const item of cart.items) {
          const product = byId.get(item.product.toString());
          if (!product || !product.isActive)
            return res
              .status(409)
              .json({ message: 'A product in your cart is no longer available.' });
          if (
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > product.stock
          )
            return res.status(409).json({ message: `Insufficient stock for ${product.name}.` });
          const linePaise = Math.round(product.price * 100) * item.quantity;
          amount += linePaise;
          snapshots.push({
            product: product._id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: item.quantity,
          });
        }
        if (!Number.isSafeInteger(amount) || amount <= 0)
          return res.status(400).json({ message: 'The cart total must be greater than zero.' });
        [order] = await OrderModel.create([
          {
            user: req.user._id,
            items: snapshots,
            shippingAddress: Object.fromEntries(
              [
                'fullName',
                'addressLine1',
                'addressLine2',
                'city',
                'state',
                'postalCode',
                'country',
              ].map((field) => [field, (req.body.shippingAddress[field] || '').trim()]),
            ),
            totalAmount: amount / 100,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'razorpay',
            idempotencyKey: appKey,
          },
        ]);
      } else {
        amount = Math.round(order.totalAmount * 100);
        if (!Number.isSafeInteger(amount) || amount <= 0)
          return res.status(400).json({ message: 'The cart total must be greater than zero.' });
      }

      const client = new RazorpayClient({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
      const razorpayOrder = await client.orders.create({
        amount,
        currency: 'INR',
        receipt: order._id.toString(),
      });
      if (!razorpayOrder?.id) throw new Error('Razorpay returned an invalid order response.');
      order = await OrderModel.findOneAndUpdate(
        { _id: order._id, user: req.user._id },
        { $set: { razorpayOrderId: razorpayOrder.id } },
        { new: true },
      );
      if (!order) throw new Error('Application order could not be linked to the Razorpay order.');
      return res.status(201).json({
        applicationOrderId: order._id,
        orderId: razorpayOrder.id,
        amount,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      logger.error('Razorpay order creation failed.', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.error?.code || error.code,
      });
      return res.status(502).json({ message: 'Could not start online payment. Please try again.' });
    }
  };
}

export const createRazorpayOrder = createRazorpayOrderHandler();

export async function verifyRazorpayPayment(req, res, next) {
  const { applicationOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body || {};
  if (
    typeof applicationOrderId !== 'string' ||
    !mongoose.isObjectIdOrHexString(applicationOrderId) ||
    typeof razorpay_order_id !== 'string' ||
    typeof razorpay_payment_id !== 'string' ||
    typeof razorpay_signature !== 'string' ||
    !/^[a-f\d]{64}$/i.test(razorpay_signature)
  )
    return res.status(400).json({ message: 'Razorpay payment details are incomplete.' });

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ message: 'Payment verification is unavailable.' });

  const expectedSignature = createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest();
  const receivedSignature = Buffer.from(razorpay_signature, 'hex');
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  )
    return res.status(400).json({ message: 'Razorpay payment signature is invalid.' });

  try {
    const order = await Order.findOne({
      _id: applicationOrderId,
      user: req.user._id,
      paymentMethod: 'razorpay',
      razorpayOrderId: razorpay_order_id,
    });
    if (!order) return res.status(404).json({ message: 'Payment order not found.' });
    if (order.paymentStatus === 'paid') {
      if (order.paymentId !== razorpay_payment_id)
        return res.status(409).json({ message: 'A different payment is already recorded.' });
      return res.json({ order });
    }
    if (order.status === 'cancelled' || order.paymentStatus !== 'pending')
      return res.status(409).json({ message: 'This order cannot be marked as paid.' });

    const verifiedOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'pending', status: { $ne: 'cancelled' } },
      { $set: { paymentStatus: 'paid', paymentId: razorpay_payment_id } },
      { new: true, runValidators: true },
    );
    if (!verifiedOrder)
      return res.status(409).json({ message: 'This order cannot be marked as paid.' });

    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
    return res.json({ order: verifiedOrder });
  } catch (error) {
    return next(error);
  }
}
