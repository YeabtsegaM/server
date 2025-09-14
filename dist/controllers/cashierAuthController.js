"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCashierToken = exports.cashierLogout = exports.cashierLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
const responseService_1 = require("../services/responseService");
const JWT_SECRET = process.env.JWT_SECRET || 'bingo2025-super-secret-jwt-key-for-admin-authentication';
const cashierLogin = async (req, res) => {
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
        // Find cashier by username (normalized to lowercase)
        const cashier = await Cashier_1.default.findOne({
            username: username.trim().toLowerCase()
        }).populate('shop', 'shopName location');
        if (!cashier) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid username or password');
            return;
        }
        // Check if account is locked/deactivated
        if (!cashier.isActive) {
            responseService_1.ResponseService.locked(res, 'Account is locked. Please contact the administrator.');
            return;
        }
        // Verify password with timing attack protection
        const isValidPassword = await cashier.comparePassword(password);
        if (!isValidPassword) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid credentials');
            return;
        }
        // Update last login
        cashier.lastLogin = new Date();
        await cashier.save();
        // Generate JWT token
        const tokenPayload = {
            id: cashier._id,
            username: cashier.username,
            role: cashier.role,
            shopId: cashier.shop
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        // Set secure cookie (optional)
        res.cookie('cashierToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        console.log('🔍 Cashier login response:', {
            id: cashier._id,
            username: cashier.username,
            sessionId: cashier.sessionId,
            displayUrl: cashier.displayUrl
        });
        responseService_1.ResponseService.success(res, {
            token,
            user: {
                id: cashier._id,
                username: cashier.username,
                fullName: cashier.fullName,
                role: cashier.role,
                shop: cashier.shop,
                sessionId: cashier.sessionId,
                displayUrl: cashier.displayUrl
            }
        });
    }
    catch (error) {
        console.error('Cashier login error:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.cashierLogin = cashierLogin;
const cashierLogout = async (req, res) => {
    try {
        // Clear the cashier token cookie
        res.clearCookie('cashierToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        responseService_1.ResponseService.success(res, { message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Cashier logout error:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.cashierLogout = cashierLogout;
const verifyCashierToken = async (req, res) => {
    try {
        const token = req.cookies.cashierToken || req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            responseService_1.ResponseService.unauthorized(res, 'No token provided');
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const cashier = await Cashier_1.default.findById(decoded.id)
            .select('-password')
            .populate('shop', 'shopName location');
        if (!cashier || !cashier.isActive) {
            responseService_1.ResponseService.unauthorized(res, 'Invalid or expired token');
            return;
        }
        console.log('🔍 Token verification response:', {
            id: cashier._id,
            username: cashier.username,
            sessionId: cashier.sessionId,
            displayUrl: cashier.displayUrl
        });
        responseService_1.ResponseService.success(res, {
            user: {
                id: cashier._id,
                username: cashier.username,
                fullName: cashier.fullName,
                role: cashier.role,
                shop: cashier.shop,
                sessionId: cashier.sessionId,
                displayUrl: cashier.displayUrl
            }
        });
    }
    catch (error) {
        console.error('Cashier token verification error:', error);
        responseService_1.ResponseService.unauthorized(res, 'Invalid or expired token');
    }
};
exports.verifyCashierToken = verifyCashierToken;
//# sourceMappingURL=cashierAuthController.js.map