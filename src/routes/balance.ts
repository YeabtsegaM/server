import express from 'express';
import { getBalanceData, getCashierDetails } from '../controllers/balanceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all balance routes
router.use(authenticateToken);

// Get balance data with filters
router.get('/data', getBalanceData);

// Get cashier details for a specific shop
router.get('/cashier-details/:shopId', getCashierDetails);

export default router; 