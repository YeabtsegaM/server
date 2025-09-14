"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verificationController_1 = require("../controllers/verificationController");
const cashierAuth_1 = require("../middleware/cashierAuth");
const router = (0, express_1.Router)();
// Apply cashier authentication to all verification routes
router.use(cashierAuth_1.authenticateCashier);
// Verify a specific cartela
router.post('/verify-cartela', verificationController_1.verifyCartela);
// Manually lock verification for a cartela
router.post('/lock-verification', verificationController_1.lockVerification);
// Get verification status for all cartelas in a game
router.get('/game/:gameId/verification-status', verificationController_1.getGameVerificationStatus);
// Batch verify multiple cartelas
router.post('/batch-verify', verificationController_1.batchVerifyCartelas);
exports.default = router;
//# sourceMappingURL=verificationRoutes.js.map