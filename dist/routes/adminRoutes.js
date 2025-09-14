"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
/**
 * Admin Routes for Shop-Specific Betting Configuration
 *
 * These routes allow admins to:
 * - Update shop-specific margin and system fee rates
 * - Get shop-specific betting configuration
 * - Manage per-shop settings in real-time
 */
// Update shop-specific betting configuration (Shop Margin, System Fee)
router.put('/shops/:shopId/betting-config', adminController_1.AdminController.updateShopBettingConfig);
// Get shop-specific betting configuration
router.get('/shops/:shopId/betting-config', adminController_1.AdminController.getShopBettingConfig);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map