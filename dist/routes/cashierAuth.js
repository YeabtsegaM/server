"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cashierAuthController_1 = require("../controllers/cashierAuthController");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.post('/login', cashierAuthController_1.cashierLogin);
router.get('/verify', cashierAuthController_1.verifyCashierToken);
// Protected routes (require authentication)
router.post('/logout', cashierAuthController_1.cashierLogout);
exports.default = router;
//# sourceMappingURL=cashierAuth.js.map