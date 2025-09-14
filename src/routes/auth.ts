import { Router } from 'express';
import { login, logout, verifyToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.get('/verify', verifyToken);

// Protected routes
router.post('/logout', authenticateToken, logout);

export default router; 