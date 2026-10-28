import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

export const MAX_REVIEW_COMMENT_LENGTH = 2000;

export function validateReview(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Review data is required.';
  if (partial && body.rating === undefined && body.comment === undefined)
    return 'Provide a rating or comment to update.';
  if (
    body.rating !== undefined &&
    (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)
  )
    return 'Rating must be an integer from 1 to 5.';
  if (
    body.comment !== undefined &&
    (typeof body.comment !== 'string' ||
      !body.comment.trim() ||
      body.comment.trim().length > MAX_REVIEW_COMMENT_LENGTH)
  )
    return `Comment is required and must be at most ${MAX_REVIEW_COMMENT_LENGTH} characters.`;
  if (!partial && body.rating === undefined) return 'Rating must be an integer from 1 to 5.';
  if (!partial && body.comment === undefined) return 'Comment is required.';
  return null;
}

export function reviewResponse(review) {
  return {
    _id: review._id,
    user: review.user?._id || review.user,
    reviewerName: review.user?.name || 'Former customer',
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

async function updateRatingSummary(productId, session) {
  const [summary] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
  ]).session(session);
  await Product.updateOne(
    { _id: productId },
    { $set: { numReviews: summary?.count || 0, ratingAvg: summary?.average || 0 } },
    { session },
  );
}

export async function listReviews(req, res, next) {
  const { idOrSlug } = req.params;
  const selector = mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };
  try {
    const product = await Product.findOne({ ...selector, isActive: true })
      .select('_id')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const reviews = await Review.find({ product: product._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ reviews: reviews.map(reviewResponse) });
  } catch (error) {
    return next(error);
  }
}

export async function createReview(req, res, next) {
  const validation = validateReview(req.body);
  if (validation) return res.status(400).json({ message: validation });
  const { idOrSlug } = req.params;
  const selector = mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };
  let session;
  try {
    session = await mongoose.startSession();
    let created;
    await session.withTransaction(async () => {
      const product = await Product.findOne({ ...selector, isActive: true }).session(session);
      if (!product) {
        const error = new Error('Product not found.');
        error.status = 404;
        throw error;
      }
      const purchased = await Order.exists({
        user: req.user._id,
        status: 'delivered',
        'items.product': product._id,
      }).session(session);
      if (!purchased) {
        const error = new Error('A delivered purchase is required to review this product.');
        error.status = 403;
        throw error;
      }
      if (await Review.exists({ user: req.user._id, product: product._id }).session(session)) {
        const error = new Error('You have already reviewed this product.');
        error.status = 409;
        throw error;
      }
      const review = new Review({
        user: req.user._id,
        product: product._id,
        rating: req.body.rating,
        comment: req.body.comment.trim(),
      });
      await review.save({ session });
      await updateRatingSummary(product._id, session);
      created = review;
    });
    const safe = await Review.findById(created._id).populate('user', 'name').lean();
    return res.status(201).json({ review: reviewResponse(safe) });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: 'You have already reviewed this product.' });
    if (error.status) return res.status(error.status).json({ message: error.message });
    return next(error);
  } finally {
    await session?.endSession();
  }
}

export async function updateReview(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.reviewId))
    return res.status(400).json({ message: 'Review ID is invalid.' });
  const validation = validateReview(req.body, { partial: true });
  if (validation) return res.status(400).json({ message: validation });
  let session;
  try {
    session = await mongoose.startSession();
    let productId;
    await session.withTransaction(async () => {
      const review = await Review.findOne({ _id: req.params.reviewId, user: req.user._id }).session(
        session,
      );
      if (!review) {
        const exists = await Review.exists({ _id: req.params.reviewId }).session(session);
        const error = new Error(
          exists ? 'You may only update your own review.' : 'Review not found.',
        );
        error.status = exists ? 403 : 404;
        throw error;
      }
      const product = await Product.findOne({ _id: review.product, isActive: true }).session(
        session,
      );
      if (!product) {
        const error = new Error('Product not found.');
        error.status = 404;
        throw error;
      }
      if (req.body.rating !== undefined) review.rating = req.body.rating;
      if (req.body.comment !== undefined) review.comment = req.body.comment.trim();
      await review.save({ session });
      productId = review.product;
      await updateRatingSummary(productId, session);
    });
    const safe = await Review.findById(req.params.reviewId).populate('user', 'name').lean();
    return res.json({ review: reviewResponse(safe) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return next(error);
  } finally {
    await session?.endSession();
  }
}

export async function deleteReview(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.reviewId))
    return res.status(400).json({ message: 'Review ID is invalid.' });
  let session;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const review = await Review.findOne({ _id: req.params.reviewId, user: req.user._id }).session(
        session,
      );
      if (!review) {
        const exists = await Review.exists({ _id: req.params.reviewId }).session(session);
        const error = new Error(
          exists ? 'You may only delete your own review.' : 'Review not found.',
        );
        error.status = exists ? 403 : 404;
        throw error;
      }
      await Review.deleteOne({ _id: review._id }, { session });
      await updateRatingSummary(review.product, session);
    });
    return res.json({ message: 'Review deleted.' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return next(error);
  } finally {
    await session?.endSession();
  }
}
