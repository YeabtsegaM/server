"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cashierAuth_1 = require("../middleware/cashierAuth");
const cartelaController_1 = require("../controllers/cartelaController");
const router = express_1.default.Router();
// Apply authentication middleware to protected routes
router.use(cashierAuth_1.authenticateCashier);
// GET /api/cartelas - Get all cartelas for a cashier
router.get('/', cartelaController_1.getCartelas);
// GET /api/cartelas/active - Get active cartelas for a cashier
router.get('/active', cartelaController_1.getActiveCartelas);
// GET /api/cartelas/:id - Get a single cartela
router.get('/:id', cartelaController_1.getCartela);
// GET /api/cartelas/by-cartela-id/:cartelaId/:cashierId - Get cartela by cartelaId number for printing
router.get('/by-cartela-id/:cartelaId/:cashierId', cartelaController_1.getCartelaByCartelaId);
// POST /api/cartelas - Create a new cartela
router.post('/', cartelaController_1.createCartela);
// PUT /api/cartelas/:id - Update a cartela
router.put('/:id', cartelaController_1.updateCartela);
// DELETE /api/cartelas/:id - Delete a cartela
router.delete('/:id', cartelaController_1.deleteCartela);
// PATCH /api/cartelas/:id/status - Toggle cartela active status
router.patch('/:id/status', cartelaController_1.toggleCartelaStatus);
// PATCH /api/cartelas/:id/toggle-status - Alternative endpoint for toggle status
router.patch('/:id/toggle-status', cartelaController_1.toggleCartelaStatus);
exports.default = router;
//# sourceMappingURL=cartelas.js.map