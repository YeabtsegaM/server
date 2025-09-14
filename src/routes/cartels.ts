import express from 'express';
import { authenticateCashier } from '../middleware/cashierAuth';
import {
  getCartelas,
  getCartela,
  createCartela,
  updateCartela,
  deleteCartela,
  toggleCartelaStatus,
  getActiveCartelas
} from '../controllers/cartelaController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateCashier);

// GET /api/cartelas - Get all cartelas for a cashier
router.get('/', getCartelas);

// GET /api/cartelas/active - Get active cartelas for a cashier
router.get('/active', getActiveCartelas);

// GET /api/cartelas/:id - Get a single cartela
router.get('/:id', getCartela);

// POST /api/cartelas - Create a new cartela
router.post('/', createCartela);

// PUT /api/cartelas/:id - Update a cartela
router.put('/:id', updateCartela);

// DELETE /api/cartelas/:id - Delete a cartela
router.delete('/:id', deleteCartela);

// PATCH /api/cartelas/:id/status - Toggle cartela active status
router.patch('/:id/status', toggleCartelaStatus);

export default router; 