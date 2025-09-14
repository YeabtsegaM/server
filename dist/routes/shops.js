"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const shopController_1 = require("../controllers/shopController");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateToken);
// GET /api/shops - Get all shops
router.get('/', shopController_1.getShops);
// POST /api/shops - Create a new shop
router.post('/', shopController_1.createShop);
// PUT /api/shops/:id - Update a shop
router.put('/:id', shopController_1.updateShop);
// DELETE /api/shops/:id - Delete a shop
router.delete('/:id', shopController_1.deleteShop);
// PATCH /api/shops/:id/status - Update shop status
router.patch('/:id/status', shopController_1.updateShopStatus);
exports.default = router;
//# sourceMappingURL=shops.js.map