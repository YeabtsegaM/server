"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const shopOwnerController_1 = require("../controllers/shopOwnerController");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateToken);
// GET /api/shop-owners - Get all shop owners
router.get('/', shopOwnerController_1.getShopOwners);
// POST /api/shop-owners - Create new shop owner
router.post('/', shopOwnerController_1.createShopOwner);
// PUT /api/shop-owners/:id - Update shop owner
router.put('/:id', shopOwnerController_1.updateShopOwner);
// DELETE /api/shop-owners/:id - Delete shop owner
router.delete('/:id', shopOwnerController_1.deleteShopOwner);
// PATCH /api/shop-owners/:id/toggle-status - Toggle shop owner status
router.patch('/:id/toggle-status', shopOwnerController_1.toggleShopOwnerStatus);
exports.default = router;
//# sourceMappingURL=shopOwners.js.map