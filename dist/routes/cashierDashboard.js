"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cashierDashboardController_1 = require("../controllers/cashierDashboardController");
const cashierAuth_1 = require("../middleware/cashierAuth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(cashierAuth_1.authenticateCashier);
// GET /api/cashier-dashboard/stats - Get dashboard statistics
router.get('/stats', cashierDashboardController_1.getDashboardStats);
// GET /api/cashier-dashboard/recent-activity - Get recent activity
router.get('/recent-activity', cashierDashboardController_1.getRecentActivity);
// Get cashier summary data
router.get('/summary', cashierDashboardController_1.getCashierSummary);
exports.default = router;
//# sourceMappingURL=cashierDashboard.js.map