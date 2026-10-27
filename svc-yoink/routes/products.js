import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../controllers/catalogController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.get('/', listProducts);
router.get('/:idOrSlug', getProduct);
router.post('/', protect, authorize('admin'), createProduct);
router.patch('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
export default router;
