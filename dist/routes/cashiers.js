"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cashierController_1 = require("../controllers/cashierController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin routes (protected) - for managing cashiers
router.get('/', auth_1.authenticateToken, cashierController_1.getCashiers);
router.post('/', auth_1.authenticateToken, cashierController_1.createCashier);
router.put('/:id', auth_1.authenticateToken, cashierController_1.updateCashier);
router.delete('/:id', auth_1.authenticateToken, cashierController_1.deleteCashier);
// PATCH /api/cashiers/:id/status - Toggle cashier active status
router.patch('/:id/status', cashierController_1.toggleCashierStatus);
// POST /api/cashiers/:id/refresh-session - Refresh cashier session
router.post('/:id/refresh-session', cashierController_1.refreshCashierSession);
// Session management routes
router.get('/:id/session', auth_1.authenticateToken, cashierController_1.getCashierSession);
router.put('/:id/session', auth_1.authenticateToken, cashierController_1.updateCashierSession);
router.patch('/:id/connection', auth_1.authenticateToken, cashierController_1.updateConnectionStatus);
router.post('/:id/regenerate-session', auth_1.authenticateToken, cashierController_1.regenerateSessionId);
// BAT file routes
router.get('/:id/bat-file/content', auth_1.authenticateToken, cashierController_1.getCashierBatFileContent);
router.get('/:id/bat-file', auth_1.authenticateToken, cashierController_1.getCashierSessionForAdmin);
exports.default = router;
//# sourceMappingURL=cashiers.js.map