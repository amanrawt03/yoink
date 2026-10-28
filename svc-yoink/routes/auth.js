import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  addSavedAddress,
  deleteSavedAddress,
  makeDefaultAddress,
} from '../controllers/accountController.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/addresses', protect, addSavedAddress);
router.patch('/addresses/:addressId/default', protect, makeDefaultAddress);
router.delete('/addresses/:addressId', protect, deleteSavedAddress);
export default router;
