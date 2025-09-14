"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const balanceController_1 = require("../controllers/balanceController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all balance routes
router.use(auth_1.authenticateToken);
// Get balance data with filters
router.get('/data', balanceController_1.getBalanceData);
// Get cashier details for a specific shop
router.get('/cashier-details/:shopId', balanceController_1.getCashierDetails);
exports.default = router;
//# sourceMappingURL=balance.js.map