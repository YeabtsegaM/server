"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shopOwnerAuthController_1 = require("../controllers/shopOwnerAuthController");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.post('/login', shopOwnerAuthController_1.shopOwnerLogin);
router.post('/logout', shopOwnerAuthController_1.shopOwnerLogout);
router.get('/verify', shopOwnerAuthController_1.verifyShopOwnerToken);
exports.default = router;
//# sourceMappingURL=shopOwnerAuth.js.map