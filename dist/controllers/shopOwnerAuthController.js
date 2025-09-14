"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyShopOwnerToken = exports.shopOwnerLogout = exports.shopOwnerLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ShopOwner_1 = __importDefault(require("../models/ShopOwner"));
const responseService_1 = require("../services/responseService");
const JWT_SECRET = process.env.JWT_SECRET || 'bingo2025-super-secret-jwt-key-for-admin-authentication';
const shopOwnerLogin = async (req, res) => {
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
        // Normalize username (same as Admin model)
        const normalizedUsername = username.trim().toLowerCase();
        // Find shop owner by username
        const shopOwner = await ShopOwner_1.default.findOne({
            username: normalizedUsername,
            isActive: true
        });
        if (!shopOwner) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid credentials');
            return;
        }
        // Verify password with timing attack protection
        const isValidPassword = await shopOwner.comparePassword(password);
        if (!isValidPassword) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid credentials');
            return;
        }
        // Update last login
        shopOwner.lastLogin = new Date();
        await shopOwner.save();
        // Generate JWT token
        const tokenPayload = {
            id: shopOwner._id,
            username: shopOwner.username,
            role: shopOwner.role
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        // Set secure cookie (optional)
        res.cookie('shopOwnerToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        responseService_1.ResponseService.success(res, {
            token,
            user: {
                id: shopOwner._id,
                username: shopOwner.username,
                fullName: `${shopOwner.firstName} ${shopOwner.lastName}`,
                role: shopOwner.role
            }
        });
    }
    catch (error) {
        console.error('Shop owner login error:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.shopOwnerLogin = shopOwnerLogin;
const shopOwnerLogout = async (req, res) => {
    try {
        // Clear cookie
        res.clearCookie('shopOwnerToken');
        responseService_1.ResponseService.success(res, { message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Shop owner logout error:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.shopOwnerLogout = shopOwnerLogout;
const verifyShopOwnerToken = async (req, res) => {
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
        // Check if shop owner still exists and is active
        const shopOwner = await ShopOwner_1.default.findById(decoded.id).select('-password');
        if (!shopOwner || !shopOwner.isActive) {
            responseService_1.ResponseService.unauthorized(res, 'User no longer exists or is inactive');
            return;
        }
        responseService_1.ResponseService.success(res, {
            user: {
                id: shopOwner._id,
                username: shopOwner.username,
                role: shopOwner.role,
                fullName: `${shopOwner.firstName} ${shopOwner.lastName}`
            }
        });
    }
    catch (error) {
        console.error('Shop owner token verification error:', error.message);
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
exports.verifyShopOwnerToken = verifyShopOwnerToken;
//# sourceMappingURL=shopOwnerAuthController.js.map