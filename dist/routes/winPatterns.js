"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cashierAuth_1 = require("../middleware/cashierAuth");
const winPatternController_1 = require("../controllers/winPatternController");
const router = express_1.default.Router();
// Apply cashier authentication to all routes
router.use(cashierAuth_1.authenticateCashier);
// Get all win patterns for the authenticated cashier
router.get('/', winPatternController_1.getWinPatterns);
// Get active win patterns (for game use)
router.get('/active', winPatternController_1.getActiveWinPatterns);
// Get a specific win pattern
router.get('/:id', winPatternController_1.getWinPattern);
// Create a new win pattern
router.post('/', winPatternController_1.createWinPattern);
// Update a win pattern
router.put('/:id', winPatternController_1.updateWinPattern);
// Delete a win pattern
router.delete('/:id', winPatternController_1.deleteWinPattern);
// Toggle pattern active status
router.patch('/:id/status', winPatternController_1.toggleWinPatternStatus);
exports.default = router;
//# sourceMappingURL=winPatterns.js.map