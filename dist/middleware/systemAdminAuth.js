"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSystemAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = __importDefault(require("../models/Admin"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const requireSystemAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: 'No authorization header'
            });
            return;
        }
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'No token provided'
            });
            return;
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!decoded || !decoded.id) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }
        // Find user and check if they are a system admin
        const admin = await Admin_1.default.findById(decoded.id);
        if (!admin) {
            res.status(401).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        if (!admin.isActive) {
            res.status(401).json({
                success: false,
                error: 'User account is inactive'
            });
            return;
        }
        if (admin.role !== 'systemadmin') {
            res.status(403).json({
                success: false,
                error: 'Access denied. System Admin privileges required.'
            });
            return;
        }
        // Add user info to request
        req.user = {
            id: admin._id,
            username: admin.username,
            role: admin.role,
            fullName: admin.fullName
        };
        next();
    }
    catch (error) {
        console.error('System admin auth error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
};
exports.requireSystemAdmin = requireSystemAdmin;
//# sourceMappingURL=systemAdminAuth.js.map