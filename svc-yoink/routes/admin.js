import { Router } from 'express';
import {
  getDashboardStats,
  listAdminCategories,
  listAdminProducts,
  listAdminUsers,
} from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/dashboard/stats', getDashboardStats);
router.get('/products', listAdminProducts);
router.get('/categories', listAdminCategories);
router.get('/users', listAdminUsers);
export default router;
