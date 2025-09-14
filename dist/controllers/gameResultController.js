"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAdminGameResults = exports.searchGames = exports.getGameResults = void 0;
const responseService_1 = require("../services/responseService");
const Shop_1 = __importDefault(require("../models/Shop"));
const CompletedGame_1 = __importDefault(require("../models/CompletedGame"));
const Game_1 = __importDefault(require("../models/Game"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
// Get game results with search filters
const getGameResults = async (req, res) => {
    try {
        const { shopId, date, time, eventId } = req.query;
        // Validate required parameters
        if (!shopId || !date || !eventId) {
            responseService_1.ResponseService.validationError(res, 'Shop ID, date, and event ID are required');
            return;
        }
        // Get shop information
        const shop = await Shop_1.default.findById(shopId);
        if (!shop) {
            responseService_1.ResponseService.notFound(res, 'shop');
            return;
        }
        // TODO: Implement real game results query from database
        // For now, return empty results until real data is available
        const gameResults = [];
        responseService_1.ResponseService.success(res, gameResults);
    }
    catch (error) {
        console.error('Error in getGameResults:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch game results');
    }
};
exports.getGameResults = getGameResults;
// Search for games by date/time and game ID
const searchGames = async (req, res) => {
    try {
        // Extract from both query params and body (POST request)
        const { startDate, endDate, gameId, cashierId } = {
            ...req.query,
            ...req.body
        };
        // If Game ID is provided, search for that specific game ONLY
        if (gameId && gameId.toString().trim() !== '') {
            // Search for the specific game by ID - EXACT MATCH ONLY
            const specificGame = await Game_1.default.findOne({ gameId: gameId.toString() });
            const specificCompletedGame = await CompletedGame_1.default.findOne({ gameId: gameId.toString() });
            if (specificGame || specificCompletedGame) {
                const gameToReturn = specificGame || specificCompletedGame;
                if (gameToReturn) {
                    let result;
                    if (specificGame) {
                        // Active game
                        result = {
                            gameId: specificGame.gameId,
                            status: specificGame.status,
                            gameStartTime: specificGame.gameData?.gameStartTime,
                            gameEndTime: specificGame.gameData?.gameEndTime,
                            finalProgress: specificGame.gameData?.progress || 0,
                            finalCalledNumbers: specificGame.gameData?.calledNumbers || [],
                            finalCurrentNumber: specificGame.gameData?.currentNumber || null,
                            finalCartelas: specificGame.gameData?.cartelas || 0,
                            finalTotalStack: specificGame.gameData?.totalStack || 0,
                            finalTotalWinStack: specificGame.gameData?.totalWinStack || 0,
                            finalTotalShopMargin: specificGame.gameData?.totalShopMargin || 0,
                            finalTotalSystemFee: specificGame.gameData?.totalSystemFee || 0,
                            finalNetPrizePool: specificGame.gameData?.netPrizePool || 0,
                            finalDrawHistory: (specificGame.gameData?.drawHistory || []).map(draw => ({
                                number: draw.number,
                                timestamp: draw.timestamp,
                                type: draw.drawnBy || 'unknown'
                            })),
                            completedAt: specificGame.updatedAt
                        };
                    }
                    else if (specificCompletedGame) {
                        // Completed game
                        result = {
                            gameId: specificCompletedGame.gameId.toString(),
                            status: specificCompletedGame.status,
                            gameStartTime: specificCompletedGame.gameData?.gameStartTime,
                            gameEndTime: specificCompletedGame.gameData?.gameEndTime,
                            finalProgress: specificCompletedGame.gameData?.finalProgress || 0,
                            finalCalledNumbers: specificCompletedGame.gameData?.finalCalledNumbers || [],
                            finalCurrentNumber: specificCompletedGame.gameData?.finalCurrentNumber || null,
                            finalCartelas: specificCompletedGame.gameData?.finalCartelas || 0,
                            finalTotalStack: specificCompletedGame.gameData?.finalTotalStack || 0,
                            finalTotalWinStack: specificCompletedGame.gameData?.finalTotalWinStack || 0,
                            finalTotalShopMargin: specificCompletedGame.gameData?.finalTotalShopMargin || 0,
                            finalTotalSystemFee: specificCompletedGame.gameData?.finalTotalSystemFee || 0,
                            finalNetPrizePool: specificCompletedGame.gameData?.finalNetPrizePool || 0,
                            finalDrawHistory: specificCompletedGame.gameData?.finalDrawHistory || [],
                            completedAt: specificCompletedGame.completedAt
                        };
                    }
                    else {
                        throw new Error('Game not found');
                    }
                    responseService_1.ResponseService.success(res, {
                        results: [result], // ONLY ONE RESULT - the exact game
                        total: 1,
                        activeGames: specificGame ? 1 : 0,
                        completedGames: specificCompletedGame ? 1 : 0
                    });
                    return; // CRITICAL: Exit here, don't continue to date search
                }
            }
            else {
                // Return empty results when no game found
                responseService_1.ResponseService.success(res, {
                    results: [],
                    total: 0,
                    activeGames: 0,
                    completedGames: 0
                });
                return; // CRITICAL: Exit here, don't continue to date search
            }
        }
        // If no Game ID provided, return error - both fields are required
        responseService_1.ResponseService.validationError(res, 'Both Date and Event No are required');
        return;
    }
    catch (error) {
        console.error('Error in searchGames:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to search games');
    }
};
exports.searchGames = searchGames;
// Admin search for game results with shop and cashier filtering
const searchAdminGameResults = async (req, res) => {
    try {
        const { shopId, cashierId, date, eventId } = {
            ...req.query,
            ...req.body
        };
        // Validate required parameters
        if (!shopId || !date || !eventId) {
            responseService_1.ResponseService.validationError(res, 'Shop ID, date, and event ID are required');
            return;
        }
        // Build search criteria for games
        const gameSearchCriteria = {
            gameId: eventId.toString()
        };
        // Add cashier filter if provided
        if (cashierId) {
            gameSearchCriteria.cashierId = cashierId;
        }
        // Add date filter
        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);
            gameSearchCriteria.createdAt = {
                $gte: searchDate,
                $lt: nextDay
            };
        }
        // Search in both active games and completed games
        const [activeGames, completedGames] = await Promise.all([
            Game_1.default.find(gameSearchCriteria).sort({ createdAt: -1 }),
            CompletedGame_1.default.find(gameSearchCriteria).sort({ createdAt: -1 })
        ]);
        // Transform results to match the expected format
        const gameResults = [];
        // Process active games
        for (const game of activeGames) {
            // Get cashier info to find shop
            const cashier = await Cashier_1.default.findById(game.cashierId);
            if (cashier && cashier.shop?.toString() === shopId) {
                const shop = await Shop_1.default.findById(shopId);
                gameResults.push({
                    eventId: game.gameId,
                    shopId: shopId,
                    shopName: shop?.shopName || 'Unknown Shop',
                    calledNumbers: game.gameData?.calledNumbers || [],
                    drawTime: game.createdAt,
                    gameType: 'Bingo'
                });
            }
        }
        // Process completed games
        for (const game of completedGames) {
            // Get cashier info to find shop
            const cashier = await Cashier_1.default.findById(game.cashierId);
            if (cashier && cashier.shop?.toString() === shopId) {
                const shop = await Shop_1.default.findById(shopId);
                gameResults.push({
                    eventId: game.gameId.toString(),
                    shopId: shopId,
                    shopName: shop?.shopName || 'Unknown Shop',
                    calledNumbers: game.gameData?.finalCalledNumbers || [],
                    drawTime: game.completedAt,
                    gameType: 'Bingo'
                });
            }
        }
        responseService_1.ResponseService.success(res, gameResults);
    }
    catch (error) {
        console.error('Error in searchAdminGameResults:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to search admin game results');
    }
};
exports.searchAdminGameResults = searchAdminGameResults;
//# sourceMappingURL=gameResultController.js.map