import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

export const MAX_PAGE_SIZE = 48;
const SORTS = { price: 'price', rating: 'ratingAvg', name: 'name', newest: 'createdAt' };

export function parseProductQuery(query) {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sortBy = 'newest',
    order = 'desc',
    page = '1',
    limit = '12',
  } = query;
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1
  )
    throw new Error('Page and limit must be positive integers.');
  if (!Object.hasOwn(SORTS, sortBy))
    throw new Error('sortBy must be price, rating, name, or newest.');
  if (!['asc', 'desc'].includes(order)) throw new Error('order must be asc or desc.');
  if (search !== undefined && (typeof search !== 'string' || search.trim().length > 100))
    throw new Error('Search must be at most 100 characters.');
  if (category !== undefined && !mongoose.isValidObjectId(category))
    throw new Error('Category must be a valid category ID.');
  const price = {};
  for (const [key, value] of [
    ['minPrice', minPrice],
    ['maxPrice', maxPrice],
  ]) {
    if (value === undefined) continue;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new Error(`${key} must be a nonnegative number.`);
    price[key === 'minPrice' ? '$gte' : '$lte'] = n;
  }
  if (price.$gte !== undefined && price.$lte !== undefined && price.$gte > price.$lte)
    throw new Error('minPrice cannot exceed maxPrice.');
  const filter = { isActive: true };
  if (search?.trim()) filter.$text = { $search: search.trim() };
  if (category) filter.category = new mongoose.Types.ObjectId(category);
  if (Object.keys(price).length) filter.price = price;
  return {
    filter,
    sort: { [SORTS[sortBy]]: order === 'asc' ? 1 : -1, _id: 1 },
    page: parsedPage,
    limit: Math.min(parsedLimit, MAX_PAGE_SIZE),
  };
}

export async function listProducts(req, res, next) {
  let params;
  try {
    params = parseProductQuery(req.query);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    const { filter, sort, page, limit } = params;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return res.json({
      products,
      pagination: { total, page, totalPages: Math.ceil(total / limit), pageSize: limit },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    const { idOrSlug } = req.params;
    const selector = mongoose.isValidObjectId(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug.toLowerCase() };
    const product = await Product.findOne({ ...selector, isActive: true })
      .populate('category', 'name slug')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
}

export async function listCategories(_req, res, next) {
  try {
    const categories = await Category.find({
      _id: { $in: await Product.distinct('category', { isActive: true }) },
    })
      .sort({ name: 1 })
      .lean();
    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
}

const validUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};
export function validateProduct(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Product data is required.';
  const { name, slug, description, price, images, category, stock } = body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 160)
    return 'Name is required and must be at most 160 characters.';
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return 'Provide a valid lowercase product slug.';
  if (typeof description !== 'string' || !description.trim() || description.length > 5000)
    return 'Description is required and must be at most 5000 characters.';
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0)
    return 'Price must be a nonnegative number.';
  if (
    !Array.isArray(images) ||
    images.length < 1 ||
    images.length > 10 ||
    images.some((image) => typeof image !== 'string' || image.length > 2048 || !validUrl(image))
  )
    return 'Provide 1 to 10 valid HTTP or HTTPS image URLs.';
  if (!mongoose.isValidObjectId(category)) return 'A valid category ID is required.';
  if (!Number.isInteger(stock) || stock < 0) return 'Stock must be a nonnegative integer.';
  if (body.featured !== undefined && typeof body.featured !== 'boolean')
    return 'Featured must be a boolean.';
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean')
    return 'isActive must be a boolean.';
  return null;
}

const writeFields = (body) => ({
  name: body.name.trim(),
  slug: body.slug,
  description: body.description.trim(),
  price: body.price,
  images: body.images,
  category: body.category,
  stock: body.stock,
  ...(body.featured !== undefined && { featured: body.featured }),
  ...(body.isActive !== undefined && { isActive: body.isActive }),
});
export async function createProduct(req, res, next) {
  try {
    const validation = validateProduct(req.body);
    if (validation) return res.status(400).json({ message: validation });
    if (!(await Category.exists({ _id: req.body.category })))
      return res.status(400).json({ message: 'Category not found.' });
    const product = await Product.create(writeFields(req.body));
    return res.status(201).json({ product });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: 'A product with that slug already exists.' });
    return next(error);
  }
}
export async function updateProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Product ID is invalid.' });
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
      return res.status(400).json({ message: 'Product data is required.' });
    const current = await Product.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Product not found.' });
    const fields = [
      'name',
      'slug',
      'description',
      'price',
      'images',
      'category',
      'stock',
      'featured',
      'isActive',
    ];
    const merged = {
      ...current.toObject(),
      ...Object.fromEntries(
        fields.filter((key) => req.body?.[key] !== undefined).map((key) => [key, req.body[key]]),
      ),
    };
    const validation = validateProduct(merged);
    if (validation) return res.status(400).json({ message: validation });
    if (!(await Category.exists({ _id: merged.category })))
      return res.status(400).json({ message: 'Category not found.' });
    const product = await Product.findByIdAndUpdate(req.params.id, writeFields(merged), {
      new: true,
      runValidators: true,
    });
    return res.json({ product });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: 'A product with that slug already exists.' });
    return next(error);
  }
}
export async function deleteProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Product ID is invalid.' });
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    await Review.deleteMany({ product: product._id });
    return res.json({ message: 'Product deleted.' });
  } catch (error) {
    return next(error);
  }
}
