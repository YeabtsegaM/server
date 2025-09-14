import express from 'express';
import { authenticateCashier } from '../middleware/cashierAuth';
import { 
  getCashierProfile, 
  updateCashierProfile, 
  getCashierSettings, 
  updateCashierSettings,
  getCurrentGame,
  startGame,
  pauseGame,
  resumeGame,
  endGame,
  resetGame,
  getNextGameInfo,
  getPlacedBetCartelas
} from '../controllers/cashierController';

const router = express.Router();

// Apply authentication middleware to all cashier routes
router.use(authenticateCashier);

// Profile routes
router.get('/profile', getCashierProfile);
router.put('/profile', updateCashierProfile);

// Settings routes
router.get('/settings', getCashierSettings);
router.put('/settings', updateCashierSettings);

// Game routes
router.get('/game/current', getCurrentGame);
router.get('/game/next', getNextGameInfo);
router.get('/game/placed-bet-cartelas', getPlacedBetCartelas);
router.post('/game/start', startGame);
router.post('/game/pause', pauseGame);
router.post('/game/resume', resumeGame);
router.post('/game/end', endGame);
router.post('/game/reset', resetGame);

export default router;
