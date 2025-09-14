"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserPassword = exports.deleteUser = exports.updateUserStatus = exports.createUser = exports.getUsers = void 0;
const Admin_1 = __importDefault(require("../models/Admin"));
const responseService_1 = require("../services/responseService");
const databaseService_1 = require("../services/databaseService");
// Transform user data for consistent response format
const transformUserData = (user) => ({
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
});
// Get all users - Optimized with service layer
const getUsers = async (req, res) => {
    try {
        const users = await databaseService_1.DatabaseService.findAll(Admin_1.default, res, 'users', {
            select: 'username fullName role isActive createdAt lastLogin',
            sort: { createdAt: -1 }
        });
        // Always return an array, even if users is null
        const usersArray = users || [];
        const transformedUsers = usersArray.map(transformUserData);
        responseService_1.ResponseService.success(res, transformedUsers);
    }
    catch (error) {
        console.error('Error in getUsers:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch users');
    }
};
exports.getUsers = getUsers;
// Create a new user - Optimized with service layer
const createUser = async (req, res) => {
    try {
        const { username, password, fullName, role } = req.body;
        // Validate required fields
        if (!username || !password || !fullName || !role) {
            responseService_1.ResponseService.validationError(res, 'Username, password, full name, and role are required');
            return;
        }
        // Validate role
        if (!['systemadmin', 'admin', 'shopadmin', 'superagent'].includes(role)) {
            responseService_1.ResponseService.validationError(res, 'Role must be systemadmin, admin, shopadmin, or superagent');
            return;
        }
        // Check if username already exists
        const exists = await databaseService_1.DatabaseService.exists(Admin_1.default, { username }, res, 'user', 'Username already exists');
        if (exists)
            return;
        // Create user with password hashing handled by model
        const user = await databaseService_1.DatabaseService.create(Admin_1.default, { username, password, fullName, role, isActive: true }, res, 'user', transformUserData);
    }
    catch (error) {
        console.error('Error in createUser:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to create user');
    }
};
exports.createUser = createUser;
// Update user status - Optimized with service layer
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            responseService_1.ResponseService.validationError(res, 'isActive must be a boolean value');
            return;
        }
        const user = await databaseService_1.DatabaseService.updateById(Admin_1.default, id, { isActive }, res, 'user', {
            select: 'username fullName role isActive createdAt lastLogin'
        });
        if (user) {
            const userResponse = transformUserData(user);
            responseService_1.ResponseService.updated(res, userResponse);
        }
    }
    catch (error) {
        console.error('Error in updateUserStatus:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to update user status');
    }
};
exports.updateUserStatus = updateUserStatus;
// Delete user - Optimized with service layer
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await databaseService_1.DatabaseService.deleteById(Admin_1.default, id, res, 'user');
    }
    catch (error) {
        console.error('Error in deleteUser:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to delete user');
    }
};
exports.deleteUser = deleteUser;
// Reset user password - Optimized with service layer
const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            responseService_1.ResponseService.validationError(res, 'New password must be at least 6 characters long');
            return;
        }
        const user = await databaseService_1.DatabaseService.findById(Admin_1.default, id, res, 'user');
        if (!user)
            return;
        // Hash the new password
        const hashedPassword = await databaseService_1.DatabaseService.hashPassword(newPassword);
        // Update the user's password
        user.password = hashedPassword;
        await user.save({ validateBeforeSave: false });
        responseService_1.ResponseService.success(res, null, 'Password reset successfully');
    }
    catch (error) {
        console.error('Error in resetUserPassword:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to reset password');
    }
};
exports.resetUserPassword = resetUserPassword;
//# sourceMappingURL=usersController.js.map