import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export function responseCart(cart) {
  const items = (cart?.items || []).map(({ product, quantity }) => {
    const available = Boolean(product?.isActive && product.stock > 0);
    return {
      product: product
        ? {
            _id: product._id,
            name: product.name,
            images: product.images,
            price: product.price,
            stock: product.stock,
            isActive: product.isActive,
          }
        : null,
      quantity,
      // Deleted products remain visible so the customer can remove them, but they
      // no longer have a price to include in the cart total.
      lineSubtotal: Number.isFinite(product?.price) ? product.price * quantity : 0,
      available,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineSubtotal, 0);
  return { items, subtotal, total: subtotal };
}

export function validateCartQuantity(quantity) {
  return Number.isInteger(quantity) && quantity > 0;
}

async function loadCart(userId) {
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart) return responseCart(null);
  const ids = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: ids } })
    .select('name images price stock isActive')
    .lean();
  const byId = new Map(products.map((product) => [product._id.toString(), product]));
  return responseCart({
    items: cart.items.map((item) => ({
      ...item,
      product: byId.get(item.product.toString()) || {
        _id: item.product,
        isActive: false,
        stock: 0,
      },
    })),
  });
}

export async function getCart(req, res, next) {
  try {
    return res.json({ cart: await loadCart(req.user._id) });
  } catch (error) {
    return next(error);
  }
}

export async function addCartItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body || {};
    if (!mongoose.isObjectIdOrHexString(productId))
      return res.status(400).json({ message: 'Product ID is invalid.' });
    if (!validateCartQuantity(quantity))
      return res.status(400).json({ message: 'Quantity must be a positive integer.' });
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return res.status(404).json({ message: 'Product not found or inactive.' });
    if (product.stock < 1) return res.status(409).json({ message: 'Product is out of stock.' });
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });
    const item = cart.items.find((entry) => entry.product.toString() === productId);
    const resultingQuantity = (item?.quantity || 0) + quantity;
    if (resultingQuantity > product.stock)
      return res.status(409).json({ message: `Only ${product.stock} available.` });
    if (item) item.quantity = resultingQuantity;
    else cart.items.push({ product: product._id, quantity });
    await cart.save();
    return res.status(201).json({ cart: await loadCart(req.user._id) });
  } catch (error) {
    return next(error);
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body || {};
    if (!mongoose.isObjectIdOrHexString(productId))
      return res.status(400).json({ message: 'Product ID is invalid.' });
    if (!validateCartQuantity(quantity))
      return res.status(400).json({ message: 'Quantity must be a positive integer.' });
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product)
      return res
        .status(404)
        .json({ message: 'Product not found or inactive; remove it from your cart.' });
    if (quantity > product.stock)
      return res.status(409).json({ message: `Only ${product.stock} available.` });
    const cart = await Cart.findOne({ user: req.user._id });
    const item = cart?.items.find((entry) => entry.product.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Cart item not found.' });
    item.quantity = quantity;
    await cart.save();
    return res.json({ cart: await loadCart(req.user._id) });
  } catch (error) {
    return next(error);
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const { productId } = req.params;
    if (!mongoose.isObjectIdOrHexString(productId))
      return res.status(400).json({ message: 'Product ID is invalid.' });
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = cart.items.filter((entry) => entry.product.toString() !== productId);
      await cart.save();
    }
    return res.json({ cart: await loadCart(req.user._id) });
  } catch (error) {
    return next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { upsert: true, new: true },
    );
    return res.json({ cart: responseCart(null) });
  } catch (error) {
    return next(error);
  }
}
