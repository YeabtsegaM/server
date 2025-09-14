"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usersController_1 = require("../controllers/usersController");
const systemAdminAuth_1 = require("../middleware/systemAdminAuth");
const router = express_1.default.Router();
// Apply system admin authentication middleware to all user routes
router.use(systemAdminAuth_1.requireSystemAdmin);
// Get all users
router.get('/', usersController_1.getUsers);
// Create a new user
router.post('/', usersController_1.createUser);
// Update user status
router.patch('/:id/status', usersController_1.updateUserStatus);
// Delete user
router.delete('/:id', usersController_1.deleteUser);
// Reset user password
router.post('/:id/reset-password', usersController_1.resetUserPassword);
exports.default = router;
//# sourceMappingURL=users.js.map