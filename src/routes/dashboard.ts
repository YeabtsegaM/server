import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Dashboard stats
router.get('/stats', getDashboardStats);

// Recent activity
router.get('/activity', getRecentActivity);

export default router; 