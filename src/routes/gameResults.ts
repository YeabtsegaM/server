import express from 'express';
import { getGameResults, searchGames, searchAdminGameResults } from '../controllers/gameResultController';

const router = express.Router();

// GET /api/game-results - Get game results with filters
router.get('/', getGameResults);

// POST /api/game-results/search - Search for games by date/time and game ID (cashier)
router.post('/search', searchGames);

// POST /api/game-results/admin-search - Admin search with shop and cashier filtering
router.post('/admin-search', searchAdminGameResults);

export default router; 