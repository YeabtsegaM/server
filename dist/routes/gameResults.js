"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gameResultController_1 = require("../controllers/gameResultController");
const router = express_1.default.Router();
// GET /api/game-results - Get game results with filters
router.get('/', gameResultController_1.getGameResults);
// POST /api/game-results/search - Search for games by date/time and game ID (cashier)
router.post('/search', gameResultController_1.searchGames);
// POST /api/game-results/admin-search - Admin search with shop and cashier filtering
router.post('/admin-search', gameResultController_1.searchAdminGameResults);
exports.default = router;
//# sourceMappingURL=gameResults.js.map