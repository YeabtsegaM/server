"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cashierAuth_1 = require("../middleware/cashierAuth");
const cashierController_1 = require("../controllers/cashierController");
const router = express_1.default.Router();
// Apply authentication middleware to all cashier routes
router.use(cashierAuth_1.authenticateCashier);
// Profile routes
router.get('/profile', cashierController_1.getCashierProfile);
router.put('/profile', cashierController_1.updateCashierProfile);
// Settings routes
router.get('/settings', cashierController_1.getCashierSettings);
router.put('/settings', cashierController_1.updateCashierSettings);
// Game routes
router.get('/game/current', cashierController_1.getCurrentGame);
router.get('/game/next', cashierController_1.getNextGameInfo);
router.get('/game/placed-bet-cartelas', cashierController_1.getPlacedBetCartelas);
router.post('/game/start', cashierController_1.startGame);
router.post('/game/pause', cashierController_1.pauseGame);
router.post('/game/resume', cashierController_1.resumeGame);
router.post('/game/end', cashierController_1.endGame);
router.post('/game/reset', cashierController_1.resetGame);
exports.default = router;
//# sourceMappingURL=cashier.js.map