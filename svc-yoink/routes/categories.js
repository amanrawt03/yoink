import { Router } from 'express';
import { listCategories } from '../controllers/catalogController.js';

const router = Router();
router.get('/', listCategories);
export default router;
