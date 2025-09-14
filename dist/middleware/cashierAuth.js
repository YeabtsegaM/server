"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateCashier = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
const JWT_SECRET = process.env.JWT_SECRET || 'bingo2025-super-secret-jwt-key-for-admin-authentication';
const authenticateCashier = async (req, res, next) => {
    try {
        const token = req.cookies.cashierToken || req.headers.authorization?.replace('Bearer ', '');
        if (token) {
        }
        if (!token) {
            res.status(401).json({ success: false, error: 'Access token required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const cashier = await Cashier_1.default.findById(decoded.id).select('-password');
        if (!cashier || !cashier.isActive) {
            res.status(401).json({ success: false, error: 'Invalid or expired token' });
            return;
        }
        // Add cashier info to request object
        req.cashier = {
            id: cashier._id?.toString() || '',
            username: cashier.username,
            role: cashier.role,
            shopId: cashier.shop?.toString() || ''
        };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};
exports.authenticateCashier = authenticateCashier;
//# sourceMappingURL=cashierAuth.js.map