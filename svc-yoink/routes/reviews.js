import { Router } from 'express';
import { deleteReview, updateReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.patch('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);
export default router;
