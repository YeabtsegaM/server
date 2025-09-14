import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getShopOwners,
  createShopOwner,
  updateShopOwner,
  deleteShopOwner,
  toggleShopOwnerStatus
} from '../controllers/shopOwnerController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/shop-owners - Get all shop owners
router.get('/', getShopOwners);

// POST /api/shop-owners - Create new shop owner
router.post('/', createShopOwner);

// PUT /api/shop-owners/:id - Update shop owner
router.put('/:id', updateShopOwner);

// DELETE /api/shop-owners/:id - Delete shop owner
router.delete('/:id', deleteShopOwner);

// PATCH /api/shop-owners/:id/toggle-status - Toggle shop owner status
router.patch('/:id/toggle-status', toggleShopOwnerStatus);

export default router; 