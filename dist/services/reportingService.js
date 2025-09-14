"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const CompletedGame_1 = __importDefault(require("../models/CompletedGame"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
/**
 * Reporting Service - Provides analytics and reporting on completed games
 *
 * This service demonstrates how to use the archived game data for:
 * - Game performance analytics
 * - Cashier performance reports
 * - Revenue tracking
 * - Game statistics
 */
class ReportingService {
    /**
     * Get game performance summary for a specific date range
     */
    static async getGamePerformanceSummary(startDate, endDate) {
        try {
            const games = await CompletedGame_1.default.find({
                'gameData.completedAt': {
                    $gte: startDate,
                    $lte: endDate
                }
            }).populate('cashierId', 'fullName username');
            const summary = {
                totalGames: games.length,
                totalRevenue: 0,
                totalWinnings: 0,
                averageProgress: 0,
                totalCartelas: 0,
                gamesByCashier: new Map(),
                gamesByStatus: new Map(),
                revenueByDay: new Map()
            };
            games.forEach(game => {
                // Calculate totals
                summary.totalRevenue += game.gameData.finalTotalStack || 0;
                summary.totalWinnings += game.gameData.finalTotalWinStack || 0;
                summary.totalCartelas += game.gameData.finalCartelas || 0;
                // Group by cashier
                const cashierName = game.cashierId?.fullName || 'Unknown';
                if (!summary.gamesByCashier.has(cashierName)) {
                    summary.gamesByCashier.set(cashierName, {
                        games: 0,
                        revenue: 0,
                        winnings: 0
                    });
                }
                const cashierStats = summary.gamesByCashier.get(cashierName);
                cashierStats.games++;
                cashierStats.revenue += game.gameData.finalTotalStack || 0;
                cashierStats.winnings += game.gameData.finalTotalWinStack || 0;
                // Group by day
                const dayKey = game.gameData.completedAt.toISOString().split('T')[0];
                if (!summary.revenueByDay.has(dayKey)) {
                    summary.revenueByDay.set(dayKey, 0);
                }
                summary.revenueByDay.set(dayKey, summary.revenueByDay.get(dayKey) + (game.gameData.finalTotalStack || 0));
            });
            // Calculate averages
            if (games.length > 0) {
                const totalProgress = games.reduce((sum, game) => sum + (game.gameData.finalProgress || 0), 0);
                summary.averageProgress = Math.round(totalProgress / games.length);
            }
            return summary;
        }
        catch (error) {
            console.error('Error getting game performance summary:', error);
            throw error;
        }
    }
    /**
     * Get cashier performance report
     */
    static async getCashierPerformanceReport(cashierId, startDate, endDate) {
        try {
            const games = await CompletedGame_1.default.find({
                cashierId,
                'gameData.completedAt': {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ 'gameData.completedAt': -1 });
            const report = {
                cashierId,
                totalGames: games.length,
                totalRevenue: 0,
                totalWinnings: 0,
                averageProgress: 0,
                games: games.map(game => ({
                    gameId: game.gameId,
                    completedAt: game.gameData.completedAt,
                    progress: game.gameData.finalProgress,
                    revenue: game.gameData.finalTotalStack,
                    winnings: game.gameData.finalTotalWinStack,
                    cartelas: game.gameData.finalCartelas,
                    calledNumbers: game.gameData.finalCalledNumbers.length
                }))
            };
            // Calculate totals
            games.forEach(game => {
                report.totalRevenue += game.gameData.finalTotalStack || 0;
                report.totalWinnings += game.gameData.finalTotalWinStack || 0;
            });
            // Calculate average progress
            if (games.length > 0) {
                const totalProgress = games.reduce((sum, game) => sum + (game.gameData.finalProgress || 0), 0);
                report.averageProgress = Math.round(totalProgress / games.length);
            }
            return report;
        }
        catch (error) {
            console.error('Error getting cashier performance report:', error);
            throw error;
        }
    }
    /**
     * Get game statistics for a specific game ID
     */
    static async getGameStatistics(gameId) {
        try {
            const game = await CompletedGame_1.default.findOne({ gameId }).populate('cashierId', 'fullName username');
            if (!game) {
                return null;
            }
            return {
                gameId: game.gameId,
                cashier: game.cashierId?.fullName || 'Unknown',
                sessionId: game.sessionId,
                startTime: game.gameData.gameStartTime,
                endTime: game.gameData.gameEndTime,
                duration: game.gameData.gameEndTime && game.gameData.gameStartTime
                    ? game.gameData.gameEndTime.getTime() - game.gameData.gameStartTime.getTime()
                    : null,
                progress: game.gameData.finalProgress,
                calledNumbers: game.gameData.finalCalledNumbers,
                drawHistory: game.gameData.finalDrawHistory,
                selectedCartelas: game.gameData.finalSelectedCartelas,
                placedBetCartelas: game.gameData.finalPlacedBetCartelas,
                totalStack: game.gameData.finalTotalStack,
                totalWinStack: game.gameData.finalTotalWinStack,
                winPatterns: game.gameData.finalWinPatterns,
                completedAt: game.gameData.completedAt
            };
        }
        catch (error) {
            console.error('Error getting game statistics:', error);
            throw error;
        }
    }
    /**
     * Get revenue trends over time
     */
    static async getRevenueTrends(startDate, endDate, groupBy = 'day') {
        try {
            const games = await CompletedGame_1.default.find({
                'gameData.completedAt': {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ 'gameData.completedAt': 1 });
            const trends = new Map();
            games.forEach(game => {
                let dateKey;
                const date = game.gameData.completedAt;
                switch (groupBy) {
                    case 'day':
                        dateKey = date.toISOString().split('T')[0];
                        break;
                    case 'week':
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        dateKey = weekStart.toISOString().split('T')[0];
                        break;
                    case 'month':
                        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        break;
                    default:
                        dateKey = date.toISOString().split('T')[0];
                }
                if (!trends.has(dateKey)) {
                    trends.set(dateKey, {
                        revenue: 0,
                        winnings: 0,
                        games: 0
                    });
                }
                const trend = trends.get(dateKey);
                trend.revenue += game.gameData.finalTotalStack || 0;
                trend.winnings += game.gameData.finalTotalWinStack || 0;
                trend.games++;
            });
            return Array.from(trends.entries()).map(([date, data]) => ({
                date,
                ...data
            }));
        }
        catch (error) {
            console.error('Error getting revenue trends:', error);
            throw error;
        }
    }
    /**
     * Get financial metrics and profit analysis
     */
    static async getFinancialMetrics(startDate, endDate) {
        try {
            const games = await CompletedGame_1.default.find({
                'gameData.completedAt': {
                    $gte: startDate,
                    $lte: endDate
                }
            });
            const metrics = {
                totalRevenue: 0,
                totalWinnings: 0,
                totalSystemFees: 0,
                totalShopProfit: 0,
                netProfit: 0,
                profitMargin: 0,
                averageBetSize: 0,
                totalBets: 0,
                revenueByDay: new Map(),
                profitByDay: new Map()
            };
            // Calculate totals from completed games
            games.forEach(game => {
                const revenue = game.gameData.finalTotalStack || 0;
                const winnings = game.gameData.finalTotalWinStack || 0;
                metrics.totalRevenue += revenue;
                metrics.totalWinnings += winnings;
                // Calculate system fees and shop profit (using default percentages if not stored)
                const systemFee = 2; // Default 2% - can be enhanced to get from GlobalConfig
                const shopMargin = 5; // Default 5% - can be enhanced to get from GlobalConfig
                const systemFeeAmount = (revenue * systemFee) / 100;
                const shopProfit = (revenue * shopMargin) / 100;
                metrics.totalSystemFees += systemFeeAmount;
                metrics.totalShopProfit += shopProfit;
                // Group by day
                const dayKey = game.gameData.completedAt.toISOString().split('T')[0];
                if (!metrics.revenueByDay.has(dayKey)) {
                    metrics.revenueByDay.set(dayKey, 0);
                    metrics.profitByDay.set(dayKey, 0);
                }
                metrics.revenueByDay.set(dayKey, metrics.revenueByDay.get(dayKey) + revenue);
                metrics.profitByDay.set(dayKey, metrics.profitByDay.get(dayKey) + (revenue - winnings - systemFeeAmount));
            });
            // Calculate net profit and margin
            metrics.netProfit = metrics.totalRevenue - metrics.totalWinnings - metrics.totalSystemFees;
            metrics.profitMargin = metrics.totalRevenue > 0 ? (metrics.netProfit / metrics.totalRevenue) * 100 : 0;
            return metrics;
        }
        catch (error) {
            console.error('Error getting financial metrics:', error);
            throw error;
        }
    }
    /**
     * Get top performing cashiers
     */
    static async getTopPerformingCashiers(limit = 10, startDate, endDate) {
        try {
            const matchStage = {};
            if (startDate && endDate) {
                matchStage['gameData.completedAt'] = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
            const cashierStats = await CompletedGame_1.default.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$cashierId',
                        totalGames: { $sum: 1 },
                        totalRevenue: { $sum: '$gameData.finalTotalStack' },
                        totalWinnings: { $sum: '$gameData.finalTotalWinStack' },
                        averageProgress: { $avg: '$gameData.finalProgress' }
                    }
                },
                {
                    $sort: { totalRevenue: -1 }
                },
                { $limit: limit }
            ]);
            // Populate cashier names
            const cashierIds = cashierStats.map(stat => stat._id);
            const cashiers = await Cashier_1.default.find({ _id: { $in: cashierIds } }, 'fullName username');
            return cashierStats.map(stat => {
                const cashier = cashiers.find((c) => c._id.toString() === stat._id.toString());
                return {
                    cashierId: stat._id,
                    cashierName: cashier?.fullName || 'Unknown',
                    username: cashier?.username || 'Unknown',
                    totalGames: stat.totalGames,
                    totalRevenue: stat.totalRevenue,
                    totalWinnings: stat.totalWinnings,
                    averageProgress: Math.round(stat.averageProgress)
                };
            });
        }
        catch (error) {
            console.error('Error getting top performing cashiers:', error);
            throw error;
        }
    }
}
exports.ReportingService = ReportingService;
//# sourceMappingURL=reportingService.js.map