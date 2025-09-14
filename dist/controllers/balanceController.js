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
exports.getCashierDetails = exports.getBalanceData = void 0;
const Shop_1 = __importDefault(require("../models/Shop"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
const responseService_1 = require("../services/responseService");
const databaseService_1 = require("../services/databaseService");
const mongoose_1 = __importDefault(require("mongoose"));
const getBalanceData = async (req, res) => {
    try {
        const { shopId, cashierId, startDate, endDate } = req.query;
        // Build filter conditions
        const shopFilter = shopId && shopId !== 'all' ? { _id: shopId } : {};
        const cashierFilter = cashierId && cashierId !== 'all' ? { _id: cashierId } : {};
        // Get shops with balance data
        const shops = await databaseService_1.DatabaseService.findAll(Shop_1.default, res, 'shops', {
            filter: shopFilter,
            populate: { path: 'owner', select: 'fullName username' },
            select: 'shopName margin status createdAt'
        });
        // Get cashiers for the selected shop
        const cashiers = await databaseService_1.DatabaseService.findAll(Cashier_1.default, res, 'cashiers', {
            filter: {
                ...cashierFilter,
                ...(shopId && shopId !== 'all' ? { shop: shopId } : {})
            },
            populate: { path: 'shop', select: 'shopName' },
            select: 'fullName username shop isActive createdAt'
        });
        // Always return arrays, even if null
        const shopsArray = shops || [];
        const cashiersArray = cashiers || [];
        // Import Bet model for real transaction data
        const Bet = (await Promise.resolve().then(() => __importStar(require('../models/Bet')))).default;
        const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
        const CompletedGame = (await Promise.resolve().then(() => __importStar(require('../models/CompletedGame')))).default;
        // Generate balance data for each shop with REAL transaction data
        const balanceData = await Promise.all(shopsArray.map(async (shop) => {
            const shopIdStr = shop._id.toString();
            // Build date filter for transactions
            let dateFilter = {};
            if (startDate && endDate) {
                // Handle timezone properly: create local date boundaries that work with MongoDB UTC storage
                const startDateStr = startDate;
                const endDateStr = endDate;
                // Create start of day in local timezone
                const startDateObj = new Date(startDateStr + 'T00:00:00');
                // Create end of day in local timezone
                const endDateObj = new Date(endDateStr + 'T23:59:59.999');
                dateFilter = {
                    placedAt: {
                        $gte: startDateObj,
                        $lte: endDateObj
                    }
                };
            }
            // Get all cashiers for this shop
            const shopCashiers = cashiersArray.filter(cashier => cashier.shop && cashier.shop._id.toString() === shopIdStr);
            const cashierIds = shopCashiers.map(cashier => cashier._id);
            // Always use the date filter - no fallback logic
            const effectiveDateFilter = dateFilter;
            // Debug: Check if there are any bets for this shop at all
            const totalBetsForShop = await Bet.countDocuments({ cashierId: { $in: cashierIds } });
            // Debug: Check if there are any bets in the date range
            const totalBetsInDateRange = await Bet.countDocuments({ ...effectiveDateFilter });
            // Debug: Check if there are any bets for this shop in the date range
            const totalBetsForShopInDateRange = await Bet.countDocuments({
                cashierId: { $in: cashierIds },
                ...effectiveDateFilter
            });
            // Calculate REAL financial data from transactions
            const [totalTickets, totalBets, totalRedeemed, totalUnclaimed, shopProfit] = await Promise.all([
                // Total tickets created
                Bet.countDocuments({
                    cashierId: { $in: cashierIds },
                    ...effectiveDateFilter
                }),
                // Total bets placed (sum of all stakes)
                Bet.aggregate([
                    {
                        $match: {
                            cashierId: { $in: cashierIds },
                            betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
                            ...effectiveDateFilter
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$stake' }
                        }
                    }
                ]).then(result => result[0]?.total || 0),
                // Total redeemed (sum of all wins)
                Bet.aggregate([
                    {
                        $match: {
                            cashierId: { $in: cashierIds },
                            betStatus: { $in: ['won_redeemed', 'lost_redeemed'] },
                            ...effectiveDateFilter
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$win' }
                        }
                    }
                ]).then(result => result[0]?.total || 0),
                // Total unclaimed (pending bets that haven't been settled + won/lost tickets that haven't been redeemed)
                // IMPORTANT: Don't filter by date for unclaimed - show ALL pending/won/lost tickets regardless of placement date
                Bet.aggregate([
                    {
                        $match: {
                            cashierId: { $in: cashierIds },
                            betStatus: { $in: ['pending', 'active', 'won', 'lost'] } // Include pending (before game ends) and won/lost (after game ends)
                            // Removed date filter for unclaimed calculation
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$stake' }
                        }
                    }
                ]).then(result => result[0]?.total || 0),
                // Shop profit (shop margin from total bets)
                Bet.aggregate([
                    {
                        $match: {
                            cashierId: { $in: cashierIds },
                            betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
                            ...effectiveDateFilter
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$stake' }
                        }
                    }
                ]).then(result => {
                    const totalStakes = result[0]?.total || 0;
                    return (totalStakes * shop.margin) / 100;
                })
            ]);
            return {
                shopId: shopIdStr,
                shopName: shop.shopName,
                totalTickets,
                totalBets,
                totalUnclaimed,
                totalRedeemed,
                shopProfit: Math.round(shopProfit * 100) / 100, // Round to 2 decimal places
                lastUpdated: new Date().toISOString()
            };
        }));
        responseService_1.ResponseService.success(res, {
            balanceData,
            shops: shopsArray,
            cashiers: cashiersArray
        });
    }
    catch (error) {
        console.error('Error in getBalanceData:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch balance data');
    }
};
exports.getBalanceData = getBalanceData;
const getCashierDetails = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { startDate, endDate, cashierId } = req.query;
        if (!shopId) {
            responseService_1.ResponseService.validationError(res, 'Shop ID is required');
            return;
        }
        // Build date filter for bets
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day
            dateFilter = {
                createdAt: {
                    $gte: start,
                    $lte: end
                }
            };
        }
        // Build cashier filter
        let cashierFilter = { shop: shopId };
        if (cashierId && cashierId !== 'all') {
            cashierFilter = { ...cashierFilter, _id: cashierId };
        }
        // Get cashiers for the specific shop
        const cashiers = await databaseService_1.DatabaseService.findAll(Cashier_1.default, res, 'cashiers', {
            filter: cashierFilter,
            populate: { path: 'shop', select: 'shopName' },
            select: 'fullName username isActive createdAt'
        });
        // Always return array, even if null
        const cashiersArray = cashiers || [];
        // Import Bet model for real transaction data
        const Bet = (await Promise.resolve().then(() => __importStar(require('../models/Bet')))).default;
        // Generate cashier details with REAL transaction data
        const cashierDetails = await Promise.all(cashiersArray.map(async (cashier) => {
            const cashierIdStr = cashier._id.toString();
            const cashierObjectId = new mongoose_1.default.Types.ObjectId(cashierIdStr); // Convert to ObjectId
            // Debug: Check if there are any bets for this cashier at all
            const totalBetsForCashier = await Bet.countDocuments({
                cashierId: cashierObjectId,
                ...dateFilter
            });
            // Calculate REAL financial data from transactions for this cashier
            const [tickets, bets, unclaimed, redeemed, netBalance, unclaimedCount, redeemCount] = await Promise.all([
                // Total tickets created by this cashier (excluding cancelled)
                Bet.countDocuments({
                    cashierId: cashierObjectId, // Use ObjectId
                    betStatus: { $ne: 'cancelled' }, // Exclude cancelled tickets
                    ...dateFilter
                }),
                // Total bets placed by this cashier (sum of all stakes)
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
                // Total unclaimed (pending bets that haven't been settled)
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
                // Total redeemed (sum of win amounts)
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
                // Net balance (total bets - total redeemed)
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
            return {
                cashierId: cashierIdStr,
                cashierName: cashier.username,
                shopName: cashier.shop?.shopName || 'N/A',
                tickets,
                bets,
                unclaimed,
                redeemed,
                netBalance: Math.round(netBalance * 100) / 100, // Round to 2 decimal places
                unclaimedCount,
                redeemCount,
                status: cashier.isActive ? 'active' : 'inactive'
            };
        }));
        responseService_1.ResponseService.success(res, cashierDetails);
    }
    catch (error) {
        console.error('Error in getCashierDetails:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch cashier details');
    }
};
exports.getCashierDetails = getCashierDetails;
//# sourceMappingURL=balanceController.js.map