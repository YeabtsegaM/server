import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getShops,
  createShop,
  updateShop,
  deleteShop,
  updateShopStatus
} from '../controllers/shopController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/shops - Get all shops
router.get('/', getShops);

// POST /api/shops - Create a new shop
router.post('/', createShop);

// PUT /api/shops/:id - Update a shop
router.put('/:id', updateShop);

// DELETE /api/shops/:id - Delete a shop
router.delete('/:id', deleteShop);

// PATCH /api/shops/:id/status - Update shop status
router.patch('/:id/status', updateShopStatus);

export default router; 