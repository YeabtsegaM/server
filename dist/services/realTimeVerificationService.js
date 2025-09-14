"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeVerificationService = void 0;
const Game_1 = __importDefault(require("../models/Game"));
const Cartela_1 = require("../models/Cartela");
const winPatternService_1 = require("./winPatternService");
class RealTimeVerificationService {
    constructor(io) {
        this.io = io;
    }
    /**
     * Check for winners after each number is drawn
     * High-performance real-time checking (optional - for display purposes)
     */
    async checkForWinnersAfterDraw(gameId, sessionId, cashierId, drawnNumbers) {
        try {
            // Get all placed cartelas for this game (real-time lookup)
            const game = await Game_1.default.findOne({ gameId, sessionId });
            if (!game || !game.gameData?.placedBetCartelas) {
                return;
            }
            const placedCartelaIds = game.gameData.placedBetCartelas;
            // Get cartela details for pattern matching (real-time lookup)
            const cartelas = await Cartela_1.Cartela.find({
                cartelaId: { $in: placedCartelaIds },
                cashierId,
                isActive: true
            });
            if (cartelas.length === 0) {
                return;
            }
            // High-performance batch pattern matching
            const matchResults = await winPatternService_1.WinPatternService.checkMultipleCartelas(cartelas, drawnNumbers, cashierId);
            // Process winners and update game state
            const winners = [];
            for (const [cartelaIdStr, result] of matchResults) {
                if (result.isWinner) {
                    const cartelaId = parseInt(cartelaIdStr);
                    winners.push({
                        cartelaId,
                        patterns: result.matchedPatterns,
                        patternNames: result.patternNames,
                        matchedNumbers: result.matchedNumbers
                    });
                }
            }
            // Update game with potential winner information (for display purposes)
            if (winners.length > 0) {
                await Game_1.default.findOneAndUpdate({ gameId, sessionId }, {
                    $set: {
                        'gameData.hasWinners': true,
                        'gameData.winnerCount': winners.length,
                        'gameData.lastWinnerCheck': new Date()
                    }
                });
                // Emit real-time winner notification to display
                this.io.to(`display:${sessionId}`).emit('potential_winners_detected', {
                    gameId,
                    winners,
                    drawnNumbers,
                    timestamp: new Date(),
                    message: 'Potential winners detected - cashier should verify'
                });
            }
        }
        catch (error) {
            console.error(`❌ Error checking for winners in game ${gameId}:`, error);
        }
    }
    /**
     * Get real-time verification status for a cartela
     * Used when cashier manually verifies (1-to-1 verification)
     */
    async getCartelaVerificationStatus(gameId, cartelaId, cashierId, drawnNumbers) {
        try {
            // Get cartela details (real-time lookup)
            const cartela = await Cartela_1.Cartela.findOne({
                cartelaId,
                cashierId,
                isActive: true
            });
            if (!cartela) {
                return null;
            }
            // Check win status using high-performance service (real-time)
            const result = await winPatternService_1.WinPatternService.checkCartelaWin(cartela, drawnNumbers, cashierId);
            return result;
        }
        catch (error) {
            console.error(`❌ Error getting verification status for cartela ${cartelaId}:`, error);
            return null;
        }
    }
    /**
     * Emit verification result to all connected clients
     */
    emitVerificationResult(sessionId, cashierId, verificationData) {
        try {
            // Emit to display
            this.io.to(`display:${sessionId}`).emit('cartela_verified', verificationData);
            // Emit to cashier
            this.io.to(`cashier:${cashierId}`).emit('cartela_verified', verificationData);
        }
        catch (error) {
            console.error('Error emitting verification result:', error);
        }
    }
    /**
     * Get verification statistics for a game
     */
    async getGameVerificationStats(gameId, sessionId) {
        try {
            const game = await Game_1.default.findOne({ gameId, sessionId });
            if (!game) {
                return null;
            }
            const placedCartelaIds = game.gameData?.placedBetCartelas || [];
            const verifiedCartelaIds = game.gameData?.verifiedCartelas || [];
            return {
                totalCartelas: placedCartelaIds.length,
                verifiedCount: verifiedCartelaIds.length,
                pendingCount: placedCartelaIds.length - verifiedCartelaIds.length,
                verificationActive: true,
                lastUpdate: new Date()
            };
        }
        catch (error) {
            console.error(`❌ Error getting verification stats for game ${gameId}:`, error);
            return null;
        }
    }
}
exports.RealTimeVerificationService = RealTimeVerificationService;
exports.default = RealTimeVerificationService;
//# sourceMappingURL=realTimeVerificationService.js.map