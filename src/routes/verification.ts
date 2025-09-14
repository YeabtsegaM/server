import { Router } from 'express';
import { verifyCartela, getGameVerificationStatus, batchVerifyCartelas } from '../controllers/verificationController';
import { authenticateCashier } from '../middleware/cashierAuth';

const router = Router();

// Apply cashier authentication to all verification routes
router.use(authenticateCashier);

// Verify a specific cartela
router.post('/verify-cartela', verifyCartela);

// Get verification status for all cartelas in a game
router.get('/game/:gameId/verification-status', getGameVerificationStatus);

// Batch verify multiple cartelas
router.post('/batch-verify', batchVerifyCartelas);

// Close verification modal on display


export default router;
