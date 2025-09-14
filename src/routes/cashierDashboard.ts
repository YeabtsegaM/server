import express from 'express';
import { getDashboardStats, getRecentActivity, getCashierSummary } from '../controllers/cashierDashboardController';
import { authenticateCashier } from '../middleware/cashierAuth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateCashier);

// GET /api/cashier-dashboard/stats - Get dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/cashier-dashboard/recent-activity - Get recent activity
router.get('/recent-activity', getRecentActivity);

// Get cashier summary data
router.get('/summary', getCashierSummary);

export default router; 