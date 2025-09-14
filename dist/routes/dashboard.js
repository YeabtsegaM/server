"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
// All dashboard routes require authentication
router.use(auth_1.authenticateToken);
// Dashboard stats
router.get('/stats', dashboardController_1.getDashboardStats);
// Recent activity
router.get('/activity', dashboardController_1.getRecentActivity);
exports.default = router;
//# sourceMappingURL=dashboard.js.map