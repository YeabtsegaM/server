import express from 'express';
import { authenticateCashier } from '../middleware/cashierAuth';
import {
  getCartelas,
  getCartela,
  createCartela,
  updateCartela,
  deleteCartela,
  toggleCartelaStatus,
  getActiveCartelas,
  getCartelaByCartelaId
} from '../controllers/cartelaController';

const router = express.Router();

// Apply authentication middleware to protected routes
router.use(authenticateCashier);

// GET /api/cartelas - Get all cartelas for a cashier
router.get('/', getCartelas);

// GET /api/cartelas/active - Get active cartelas for a cashier
router.get('/active', getActiveCartelas);

// GET /api/cartelas/:id - Get a single cartela
router.get('/:id', getCartela);

// GET /api/cartelas/by-cartela-id/:cartelaId/:cashierId - Get cartela by cartelaId number for printing
router.get('/by-cartela-id/:cartelaId/:cashierId', getCartelaByCartelaId);

// POST /api/cartelas - Create a new cartela
router.post('/', createCartela);

// PUT /api/cartelas/:id - Update a cartela
router.put('/:id', updateCartela);

// DELETE /api/cartelas/:id - Delete a cartela
router.delete('/:id', deleteCartela);

// PATCH /api/cartelas/:id/status - Toggle cartela active status
router.patch('/:id/status', toggleCartelaStatus);

// PATCH /api/cartelas/:id/toggle-status - Alternative endpoint for toggle status
router.patch('/:id/toggle-status', toggleCartelaStatus);

export default router; 