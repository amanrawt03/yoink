import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const MAX_PAGE_SIZE = 50;

export function parseAdminPagination(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1)
    throw new Error('Page and limit must be positive integers.');
  return { page, limit: Math.min(limit, MAX_PAGE_SIZE) };
}

export function buildDashboardStats(products, users, orders) {
  const byStatus = Object.fromEntries(
    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => [status, 0]),
  );
  let revenue = 0;
  for (const order of orders) {
    const status = order.status ?? order._id;
    if (Object.hasOwn(byStatus, status)) byStatus[status] += order.count;
    revenue += order.revenue || 0;
  }
  return {
    totalProducts: products,
    totalUsers: users,
    totalOrders: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
    ordersByStatus: byStatus,
    revenue,
  };
}

export async function getDashboardStats(_req, res, next) {
  try {
    const [products, users, orderStats] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $eq: ['$paymentStatus', 'paid'] }, { $ne: ['$status', 'cancelled'] }],
                  },
                  '$totalAmount',
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);
    return res.json({ stats: buildDashboardStats(products, users, orderStats) });
  } catch (error) {
    return next(error);
  }
}

export async function listAdminProducts(req, res, next) {
  let pagination;
  try {
    pagination = parseAdminPagination(req.query);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    const { page, limit } = pagination;
    const filter = {};
    if (req.query.isActive !== undefined) {
      if (!['true', 'false'].includes(req.query.isActive))
        return res.status(400).json({ message: 'isActive must be true or false.' });
      filter.isActive = req.query.isActive === 'true';
    }
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return res.json({
      products,
      pagination: { total, page, pageSize: limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listAdminUsers(req, res, next) {
  let pagination;
  try {
    pagination = parseAdminPagination(req.query);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    const { page, limit } = pagination;
    const [users, total] = await Promise.all([
      User.find()
        .select('_id name email role createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);
    return res.json({
      users,
      pagination: { total, page, pageSize: limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listAdminCategories(_req, res, next) {
  try {
    return res.json({
      categories: await Category.find().select('_id name slug').sort({ name: 1 }).lean(),
    });
  } catch (error) {
    return next(error);
  }
}
