"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.logout = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = __importDefault(require("../models/Admin"));
const responseService_1 = require("../services/responseService");
const databaseService_1 = require("../services/databaseService");
const JWT_SECRET = process.env.JWT_SECRET || 'bingo2025-super-secret-jwt-key-for-admin-authentication';
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Input validation
        if (!username || !password) {
            responseService_1.ResponseService.validationError(res, 'Username and password are required');
            return;
        }
        if (typeof username !== 'string' || typeof password !== 'string') {
            responseService_1.ResponseService.validationError(res, 'Invalid input types');
            return;
        }
        // Find admin by username (normalized to lowercase)
        const admin = await Admin_1.default.findOne({
            username: username.trim().toLowerCase(),
            isActive: true
        });
        if (!admin) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid credentials');
            return;
        }
        // Verify password with timing attack protection
        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid credentials');
            return;
        }
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        // Generate JWT token
        const tokenPayload = {
            id: admin._id,
            username: admin.username,
            role: admin.role
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        // Set secure cookie (optional)
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        responseService_1.ResponseService.success(res, {
            token,
            user: {
                id: admin._id,
                username: admin.username,
                fullName: admin.fullName,
                role: admin.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        // Clear the cookie
        res.clearCookie('adminToken');
        responseService_1.ResponseService.success(res, null, 'Logged out successfully');
    }
    catch (error) {
        console.error('Logout error:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.logout = logout;
const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            responseService_1.ResponseService.unauthorized(res, 'No authorization header');
            return;
        }
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        if (!token) {
            responseService_1.ResponseService.unauthorized(res, 'No token provided');
            return;
        }
        // Validate token format before verification
        if (token.split('.').length !== 3) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid token format');
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check if admin still exists and is active
        const admin = await databaseService_1.DatabaseService.findById(Admin_1.default, decoded.id, res, 'admin', '-password');
        if (!admin || !admin.isActive) {
            responseService_1.ResponseService.unauthorized(res, 'User no longer exists or is inactive');
            return;
        }
        responseService_1.ResponseService.success(res, {
            user: {
                id: admin._id,
                username: admin.username,
                role: admin.role,
                fullName: admin.fullName
            }
        });
    }
    catch (error) {
        console.error('Token verification error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            responseService_1.ResponseService.unauthorized(res, 'Invalid token');
        }
        else if (error.name === 'TokenExpiredError') {
            responseService_1.ResponseService.unauthorized(res, 'Token expired');
        }
        else {
            responseService_1.ResponseService.serverError(res, 'Token verification failed');
        }
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=authController.js.map