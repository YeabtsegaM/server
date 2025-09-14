import express from 'express';
import { AdminController } from '../controllers/adminController';

const router = express.Router();

/**
 * Admin Routes for Shop-Specific Betting Configuration
 * 
 * These routes allow admins to:
 * - Update shop-specific margin and system fee rates
 * - Get shop-specific betting configuration
 * - Manage per-shop settings in real-time
 */

// Update shop-specific betting configuration (Shop Margin, System Fee)
router.put('/shops/:shopId/betting-config', AdminController.updateShopBettingConfig);

// Get shop-specific betting configuration
router.get('/shops/:shopId/betting-config', AdminController.getShopBettingConfig);

export default router;
