"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentActivity = exports.getDashboardStats = void 0;
const ShopOwner_1 = __importDefault(require("../models/ShopOwner"));
const Shop_1 = __importDefault(require("../models/Shop"));
const Admin_1 = __importDefault(require("../models/Admin"));
const getDashboardStats = async (req, res) => {
    try {
        // Get real statistics from database
        const [totalShopOwners, activeShopOwners, totalShops, activeShops, totalAdmins, recentShopOwners, recentShops] = await Promise.all([
            // Total shop owners
            ShopOwner_1.default.countDocuments(),
            // Active shop owners
            ShopOwner_1.default.countDocuments({ isActive: true }),
            // Total shops
            Shop_1.default.countDocuments(),
            // Active shops
            Shop_1.default.countDocuments({ status: 'active' }),
            // Total admins
            Admin_1.default.countDocuments({ isActive: true }),
            // Recent shop owners
            ShopOwner_1.default.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('fullName username isActive createdAt')
                .populate('owner', 'fullName username'),
            // Recent shops
            Shop_1.default.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('shopName owner status createdAt')
                .populate('owner', 'fullName username firstName lastName')
        ]);
        const stats = {
            totalShopOwners: {
                value: totalShopOwners
            },
            activeShopOwners: {
                value: activeShopOwners
            },
            totalShops: {
                value: totalShops
            },
            activeShops: {
                value: activeShops
            }
        };
        res.json({
            success: true,
            data: {
                stats,
                recentShopOwners,
                recentShops
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard stats'
        });
    }
};
exports.getDashboardStats = getDashboardStats;
const getRecentActivity = async (req, res) => {
    try {
        const [recentShopOwners, recentShops] = await Promise.all([
            ShopOwner_1.default.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('fullName username isActive createdAt lastLogin'),
            Shop_1.default.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('shopName owner status createdAt')
                .populate('owner', 'fullName username firstName lastName')
        ]);
        res.json({
            success: true,
            data: {
                recentShopOwners,
                recentShops
            }
        });
    }
    catch (error) {
        console.error('Activity error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity'
        });
    }
};
exports.getRecentActivity = getRecentActivity;
//# sourceMappingURL=dashboardController.js.map