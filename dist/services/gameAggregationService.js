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
exports.GameAggregationService = void 0;
const Bet_1 = __importDefault(require("../models/Bet"));
const Game_1 = __importDefault(require("../models/Game"));
class GameAggregationService {
    /**
     * Aggregate all bet data for a specific game session
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID (REQUIRED to prevent data contamination)
     * @returns Aggregated game data with financial totals
     */
    static async aggregateGameData(sessionId, gameId) {
        try {
            // Get current game to check timestamp
            const currentGame = await Game_1.default.findOne({ sessionId, gameId });
            if (!currentGame) {
                throw new Error(`Game not found for session: ${sessionId}, game: ${gameId}`);
            }
            // Check if game is older than 24 hours (new day scenario)
            const now = new Date();
            const gameCreatedAt = currentGame.createdAt;
            const timeDifferenceMs = now.getTime() - gameCreatedAt.getTime();
            const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);
            // If game is older than 24 hours, return clean data (new day scenario)
            if (timeDifferenceHours >= 24) {
                return {
                    cartelas: 0,
                    stack: 0, // Added this for consistency
                    totalStack: 0,
                    totalShopMargin: 0,
                    totalSystemFee: 0,
                    netPrizePool: 0,
                    totalWinStack: 0,
                    netShopProfit: 0,
                    placedBetCartelas: []
                };
            }
            // Get shop configuration for margin calculations
            const Shop = (await Promise.resolve().then(() => __importStar(require('../models/Shop')))).default;
            const Cashier = (await Promise.resolve().then(() => __importStar(require('../models/Cashier')))).default;
            // First get the cashier to find their shop
            const cashier = await Cashier.findById(currentGame.cashierId);
            if (!cashier) {
                throw new Error(`Cashier not found: ${currentGame.cashierId}`);
            }
            // Then get the shop through the cashier's shop field
            const shop = await Shop.findById(cashier.shop);
            if (!shop) {
                throw new Error(`Shop not found for cashier: ${currentGame.cashierId}`);
            }
            // Get all bets for this game (include pending, active, won, and lost - exclude only cancelled)
            const bets = await Bet_1.default.find({
                gameId,
                sessionId,
                betStatus: { $in: ['pending', 'active', 'won', 'lost'] } // Include verified tickets
            }).sort({ placedAt: 1 });
            if (bets.length === 0) {
                return {
                    cartelas: 0,
                    stack: 0,
                    totalStack: 0,
                    totalShopMargin: 0,
                    totalSystemFee: 0,
                    netPrizePool: 0,
                    totalWinStack: 0,
                    netShopProfit: 0,
                    placedBetCartelas: []
                };
            }
            // Calculate totals from individual bets
            const aggregation = bets.reduce((acc, bet) => {
                acc.cartelas += 1;
                acc.totalStack += bet.stake;
                const grossShopMarginAmount = (bet.stake * shop.margin) / 100;
                acc.totalShopMargin += grossShopMarginAmount;
                // Calculate net shop profit 
                acc.netShopProfit = acc.totalShopMargin;
                acc.placedBetCartelas.push(bet.cartelaId);
                return acc;
            }, {
                cartelas: 0,
                stack: 0, // Will be set from the first bet
                totalStack: 0,
                totalShopMargin: 0,
                totalSystemFee: 0,
                netPrizePool: 0,
                totalWinStack: 0,
                netShopProfit: 0,
                placedBetCartelas: []
            });
            // Set the individual stake amount from the first bet
            if (bets.length > 0) {
                aggregation.stack = bets[0].stake;
            }
            // Calculate net prize pool (what winner gets)
            // Winner gets total stack minus gross shop margin amount
            aggregation.netPrizePool = aggregation.totalStack - aggregation.totalShopMargin;
            // For "one winner only" rule, totalWinStack = netPrizePool
            aggregation.totalWinStack = aggregation.netPrizePool;
            return aggregation;
        }
        catch (error) {
            console.error('Error aggregating game data:', error);
            throw error;
        }
    }
    /**
     * Update game document with aggregated bet data
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID (REQUIRED to prevent data contamination)
     * @returns Updated game document
     */
    static async updateGameWithAggregatedData(sessionId, gameId) {
        try {
            // CRITICAL FIX: Always require gameId to prevent old bet data contamination
            if (!gameId) {
                throw new Error('Game ID is required to prevent data contamination between games');
            }
            const aggregatedData = await this.aggregateGameData(sessionId, gameId);
            const updatedGame = await Game_1.default.findOneAndUpdate({ sessionId, gameId }, // Also filter by gameId for extra safety
            {
                $set: {
                    'gameData.cartelas': aggregatedData.cartelas,
                    'gameData.stack': aggregatedData.stack,
                    'gameData.totalStack': aggregatedData.totalStack,
                    'gameData.totalShopMargin': aggregatedData.totalShopMargin,
                    'gameData.totalSystemFee': aggregatedData.totalSystemFee,
                    'gameData.netPrizePool': aggregatedData.netPrizePool,
                    'gameData.totalWinStack': aggregatedData.totalWinStack,
                    'gameData.netShopProfit': aggregatedData.netShopProfit,
                    'gameData.placedBetCartelas': aggregatedData.placedBetCartelas
                },
                lastActivity: new Date()
            }, { new: true });
            if (!updatedGame) {
                throw new Error(`Game not found for session: ${sessionId}, game: ${gameId}`);
            }
            return updatedGame;
        }
        catch (error) {
            console.error('Error updating game with aggregated data:', error);
            throw error;
        }
    }
    /**
     * Get real-time game data with latest aggregated bet information
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID (REQUIRED to prevent data contamination)
     * @returns Complete game data with real-time totals
     */
    static async getRealTimeGameData(sessionId, gameId) {
        try {
            // CRITICAL FIX: Always require gameId to prevent old bet data contamination
            if (!gameId) {
                throw new Error('Game ID is required to prevent data contamination between games');
            }
            // First update the game with latest aggregated data
            const updatedGame = await this.updateGameWithAggregatedData(sessionId, gameId);
            if (!updatedGame) {
                throw new Error(`Game not found for session: ${sessionId}, game: ${gameId}`);
            }
            return updatedGame;
        }
        catch (error) {
            console.error('Error getting real-time game data:', error);
            throw error;
        }
    }
    /**
     * Move completed game to completedgames collection with full aggregated data
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID
     * @returns Created CompletedGame document
     */
    static async moveGameToCompleted(sessionId, gameId) {
        try {
            // Get the current game with all its data
            const currentGame = await Game_1.default.findOne({ sessionId, gameId });
            if (!currentGame) {
                throw new Error(`Game not found for session: ${sessionId}, game: ${gameId}`);
            }
            // Get the latest aggregated data
            const aggregatedData = await this.aggregateGameData(sessionId, gameId);
            // Import CompletedGame model
            const CompletedGame = (await Promise.resolve().then(() => __importStar(require('../models/CompletedGame')))).default;
            // Create the completed game document with all the data
            const completedGame = new CompletedGame({
                gameId: currentGame.gameId,
                cashierId: currentGame.cashierId,
                sessionId: currentGame.sessionId,
                status: 'completed',
                gameData: {
                    gameStartTime: currentGame.createdAt,
                    gameEndTime: new Date(),
                    finalProgress: currentGame.gameData?.progress || 0,
                    finalCalledNumbers: currentGame.gameData?.calledNumbers || [],
                    finalCurrentNumber: currentGame.gameData?.currentNumber || null,
                    finalCartelas: aggregatedData.cartelas,
                    finalStack: aggregatedData.stack,
                    finalTotalStack: aggregatedData.totalStack,
                    finalTotalWinStack: aggregatedData.totalWinStack,
                    finalTotalShopMargin: aggregatedData.totalShopMargin,
                    finalTotalSystemFee: aggregatedData.totalSystemFee,
                    finalNetPrizePool: aggregatedData.netPrizePool,
                    finalNetShopProfit: aggregatedData.netShopProfit,
                    finalDrawHistory: currentGame.gameData?.drawHistory || [],
                    finalSelectedCartelas: currentGame.gameData?.selectedCartelas || [],
                    finalPlacedBetCartelas: aggregatedData.placedBetCartelas,
                    finalWinPatterns: currentGame.gameData?.winPatterns || [],
                    // NEW: Transfer verification results with multiple pattern support for reporting
                    finalVerificationResults: currentGame.gameData?.verificationResults || {},
                    completedAt: new Date()
                },
                connectionStatus: currentGame.connectionStatus,
                createdAt: currentGame.createdAt,
                completedAt: new Date()
            });
            // Save the completed game
            await completedGame.save();
            // MARK ALL PENDING TICKETS AS LOST when game is completed
            // This ensures all tickets have a final status (won/lost) for proper unclaimed calculation
            try {
                const Bet = (await Promise.resolve().then(() => __importStar(require('../models/Bet')))).default;
                const pendingTicketsResult = await Bet.updateMany({
                    gameId: currentGame.gameId,
                    cashierId: currentGame.cashierId,
                    betStatus: 'pending' // Only update pending tickets
                }, {
                    betStatus: 'lost',
                    settledAt: new Date(),
                    win: 0, // Set win amount to 0 for lost tickets
                    notes: 'Game completed - ticket automatically marked as lost'
                });
            }
            catch (ticketUpdateError) {
                console.error('❌ Error updating pending tickets to lost status:', ticketUpdateError);
                // Don't fail the game completion process if ticket update fails
            }
            return completedGame;
        }
        catch (error) {
            console.error('Error moving game to completed:', error);
            throw error;
        }
    }
    /**
     * RECOVERY FUNCTION: Fix all corrupted games in completedgames collection
     * This function will re-aggregate financial data for games that were corrupted
     * @returns Number of games fixed
     */
    static async recoverCorruptedCompletedGames() {
        try {
            const CompletedGame = (await Promise.resolve().then(() => __importStar(require('../models/CompletedGame')))).default;
            // Find all completed games with empty financial data
            const corruptedGames = await CompletedGame.find({
                $or: [
                    { 'gameData.finalCartelas': 0 },
                    { 'gameData.finalTotalStack': 0 },
                    { 'gameData.finalNetPrizePool': 0 }
                ]
            });
            let fixedCount = 0;
            for (const completedGame of corruptedGames) {
                try {
                    // Re-aggregate the data from original bet records
                    const aggregatedData = await this.aggregateGameData(completedGame.sessionId, String(completedGame.gameId));
                    // Update the completed game with correct financial data
                    await CompletedGame.findByIdAndUpdate(completedGame._id, {
                        $set: {
                            'gameData.finalCartelas': aggregatedData.cartelas,
                            'gameData.finalStack': aggregatedData.stack,
                            'gameData.finalTotalStack': aggregatedData.totalStack,
                            'gameData.finalTotalWinStack': aggregatedData.totalWinStack,
                            'gameData.finalTotalShopMargin': aggregatedData.totalShopMargin,
                            'gameData.finalTotalSystemFee': aggregatedData.totalSystemFee,
                            'gameData.finalNetPrizePool': aggregatedData.netPrizePool,
                            'gameData.finalNetShopProfit': aggregatedData.netShopProfit,
                            'gameData.finalPlacedBetCartelas': aggregatedData.placedBetCartelas
                        }
                    });
                    fixedCount++;
                }
                catch (error) {
                    console.error(`❌ Error fixing game ${completedGame.gameId}:`, error);
                }
            }
            return fixedCount;
        }
        catch (error) {
            console.error('❌ Error during recovery:', error);
            throw error;
        }
    }
}
exports.GameAggregationService = GameAggregationService;
exports.default = GameAggregationService;
//# sourceMappingURL=gameAggregationService.js.map