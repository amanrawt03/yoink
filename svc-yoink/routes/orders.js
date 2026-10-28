import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/', authorize('admin'), getAllOrders);
router.patch('/:id/status', authorize('admin'), updateOrderStatus);
router.get('/:id', getOrder);
export default router;
