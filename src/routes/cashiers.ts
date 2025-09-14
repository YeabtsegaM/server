import express from 'express';
import {
  getCashiers,
  createCashier,
  updateCashier,
  deleteCashier,
  toggleCashierStatus,
  updateCashierSession,
  updateConnectionStatus,
  regenerateSessionId,
  getCashierSession,
  getCashierBatFileContent,
  getCashierSessionForAdmin,
  refreshCashierSession
} from '../controllers/cashierController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Admin routes (protected) - for managing cashiers
router.get('/', authenticateToken, getCashiers);
router.post('/', authenticateToken, createCashier);
router.put('/:id', authenticateToken, updateCashier);
router.delete('/:id', authenticateToken, deleteCashier);

// PATCH /api/cashiers/:id/status - Toggle cashier active status
router.patch('/:id/status', toggleCashierStatus);

// POST /api/cashiers/:id/refresh-session - Refresh cashier session
router.post('/:id/refresh-session', refreshCashierSession);

// Session management routes
router.get('/:id/session', authenticateToken, getCashierSession);
router.put('/:id/session', authenticateToken, updateCashierSession);
router.patch('/:id/connection', authenticateToken, updateConnectionStatus);
router.post('/:id/regenerate-session', authenticateToken, regenerateSessionId);

// BAT file routes
router.get('/:id/bat-file/content', authenticateToken, getCashierBatFileContent);
router.get('/:id/bat-file', authenticateToken, getCashierSessionForAdmin);

export default router; 