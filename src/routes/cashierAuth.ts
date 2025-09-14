import { Router } from 'express';
import { cashierLogin, cashierLogout, verifyCashierToken } from '../controllers/cashierAuthController';

const router = Router();

// Public routes (no authentication required)
router.post('/login', cashierLogin);
router.get('/verify', verifyCashierToken);

// Protected routes (require authentication)
router.post('/logout', cashierLogout);

export default router; 