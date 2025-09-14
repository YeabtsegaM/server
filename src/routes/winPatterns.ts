import express from 'express';
import { authenticateCashier } from '../middleware/cashierAuth';
import {
  getWinPatterns,
  getWinPattern,
  createWinPattern,
  updateWinPattern,
  deleteWinPattern,
  toggleWinPatternStatus,
  getActiveWinPatterns
} from '../controllers/winPatternController';

const router = express.Router();

// Apply cashier authentication to all routes
router.use(authenticateCashier);

// Get all win patterns for the authenticated cashier
router.get('/', getWinPatterns);

// Get active win patterns (for game use)
router.get('/active', getActiveWinPatterns);

// Get a specific win pattern
router.get('/:id', getWinPattern);

// Create a new win pattern
router.post('/', createWinPattern);

// Update a win pattern
router.put('/:id', updateWinPattern);

// Delete a win pattern
router.delete('/:id', deleteWinPattern);

// Toggle pattern active status
router.patch('/:id/status', toggleWinPatternStatus);

export default router; 