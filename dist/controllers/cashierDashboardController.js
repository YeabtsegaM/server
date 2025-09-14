"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCashierSummary = exports.getRecentActivity = exports.getDashboardStats = void 0;
const responseService_1 = require("../services/responseService");
const Cashier_1 = __importDefault(require("../models/Cashier"));
const mongoose_1 = __importDefault(require("mongoose")); // Add mongoose import for ObjectId conversion
const getDashboardStats = async (req, res) => {
    try {
        const cashierId = req.cashier?.id;
        if (!cashierId) {
            responseService_1.ResponseService.unauthorized(res, 'Cashier not authenticated');
            return;
        }
        // Get cashier's shop
        const cashier = await Cashier_1.default.findById(cashierId).populate('shop');
        if (!cashier) {
            responseService_1.ResponseService.notFound(res, 'cashier');
            return;
        }
        // TODO: Implement real dashboard stats calculation
        // For now, return empty stats until real data is available
        const stats = {
            totalCartelas: 0,
            totalRevenue: 0,
            activeGames: 0,
            completedGames: 0
        };
        responseService_1.ResponseService.success(res, stats);
    }
    catch (error) {
        console.error('Error in getDashboardStats:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch dashboard stats');
    }
};
exports.getDashboardStats = getDashboardStats;
const getRecentActivity = async (req, res) => {
    try {
        const cashierId = req.cashier?.id;
        if (!cashierId) {
            responseService_1.ResponseService.unauthorized(res, 'Cashier not authenticated');
            return;
        }
        // TODO: Implement real activity logging
        // For now, return empty activities until real logging is implemented
        const activities = [];
        responseService_1.ResponseService.success(res, activities);
    }
    catch (error) {
        console.error('Error in getRecentActivity:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch recent activity');
    }
};
exports.getRecentActivity = getRecentActivity;
const getCashierSummary = async (req, res) => {
    try {
        const cashierId = req.cashier.id;
        const { fromDate, toDate } = req.query;
        if (!fromDate || !toDate) {
            responseService_1.ResponseService.validationError(res, 'From date and to date are required');
            return;
        }
        // Convert string cashierId to ObjectId for proper database queries
        const cashierObjectId = new mongoose_1.default.Types.ObjectId(cashierId);
        // Get cashier details
        const cashier = await Cashier_1.default.findById(cashierId).populate('shop', 'shopName');
        if (!cashier) {
            responseService_1.ResponseService.notFound(res, 'Cashier not found');
            return;
        }
        // Import Bet model for real transaction data
        const Bet = (await Promise.resolve().then(() => __importStar(require('../models/Bet')))).default;
        // Build date filter for transactions - make it more flexible
        // Handle timezone properly: create local date boundaries that work with MongoDB UTC storage
        const fromDateStr = fromDate;
        const toDateStr = toDate;
        // Create start of day in local timezone
        const fromDateObj = new Date(fromDateStr + 'T00:00:00');
        // Create end of day in local timezone  
        const toDateObj = new Date(toDateStr + 'T23:59:59.999');
        const dateFilter = {
            placedAt: {
                $gte: fromDateObj,
                $lte: toDateObj
            }
        };
        // Calculate REAL financial data from transactions for this cashier
        const [tickets, bets, unclaimed, redeemed, netBalance, unclaimedCount, redeemCount] = await Promise.all([
            // Total tickets created by this cashier in date range (excluding cancelled)
            Bet.countDocuments({
                cashierId: cashierObjectId, // Use ObjectId
                betStatus: { $ne: 'cancelled' }, // Exclude cancelled tickets
                ...dateFilter
            }),
            // Total bets placed by this cashier in date range (sum of all stakes)
            Bet.aggregate([
                {
                    $match: {
                        cashierId: cashierObjectId, // Use ObjectId
                        betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$stake' }
                    }
                }
            ]).then(result => result[0]?.total || 0),
            // Total unclaimed (pending bets that haven't been settled + won/lost tickets that haven't been redeemed) in date range
            // Before game ends: include pending tickets, After game ends: include won/lost tickets
            Bet.aggregate([
                {
                    $match: {
                        cashierId: cashierObjectId, // Use ObjectId
                        betStatus: { $in: ['pending', 'active', 'won', 'lost'] }, // Include pending (before game ends) and won/lost (after game ends)
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$stake' }
                    }
                }
            ]).then(result => result[0]?.total || 0),
            // Total redeemed (sum of win amounts) in date range
            Bet.aggregate([
                {
                    $match: {
                        cashierId: cashierObjectId, // Use ObjectId
                        betStatus: { $in: ['won_redeemed', 'lost_redeemed'] },
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$win' }
                    }
                }
            ]).then(result => result[0]?.total || 0),
            // Net balance (total bets - total redeemed) in date range
            Bet.aggregate([
                {
                    $match: {
                        cashierId: cashierObjectId, // Use ObjectId
                        betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalBets: { $sum: '$stake' },
                        totalRedeemed: { $sum: { $cond: [{ $in: ['$betStatus', ['won_redeemed', 'lost_redeemed']] }, '$win', 0] } }
                    }
                }
            ]).then(result => {
                const totalBets = result[0]?.totalBets || 0;
                const totalRedeemed = result[0]?.totalRedeemed || 0;
                return totalBets - totalRedeemed;
            }),
            // NEW: Count unique games with unclaimed tickets (pending/won/lost)
            Bet.aggregate([
                {
                    $match: {
                        cashierId: cashierObjectId,
                        betStatus: { $in: ['pending', 'active', 'won', 'lost'] },
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: '$gameId' // Group by gameId to count unique games
                    }
                },
                {
                    $count: 'totalGames'
                }
            ]).then(result => result[0]?.totalGames || 0),
            // NEW: Count unique games that have been redeemed (won_redeemed/lost_redeemed)
            Bet.aggregate([
                {
                    $match: {
                        cashierId: cashierObjectId,
                        betStatus: { $in: ['won_redeemed', 'lost_redeemed'] },
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: '$gameId' // Group by gameId to count unique games
                    }
                },
                {
                    $count: 'totalGames'
                }
            ]).then(result => result[0]?.totalGames || 0)
        ]);
        const summaryData = {
            cashierName: cashier.username,
            fromDate: fromDate,
            toDate: toDate,
            tickets,
            bets,
            unclaimed,
            redeemed,
            netBalance: Math.round(netBalance * 100) / 100, // Round to 2 decimal places
            unclaimedCount,
            redeemCount,
            shopName: cashier.shop?.shopName || 'Unknown Shop'
        };
        responseService_1.ResponseService.success(res, summaryData);
    }
    catch (error) {
        console.error('Error in getCashierSummary:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch cashier summary');
    }
};
exports.getCashierSummary = getCashierSummary;
//# sourceMappingURL=cashierDashboardController.js.map