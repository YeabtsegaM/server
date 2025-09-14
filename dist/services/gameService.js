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
const Game_1 = __importDefault(require("../models/Game"));
const gameIdService_1 = require("./gameIdService");
const gameIdUtils_1 = require("../utils/gameIdUtils");
const numberPoolService_1 = require("./numberPoolService");
const autoDrawController_1 = require("./autoDrawController");
class GameService {
    constructor(io) {
        this.activeGames = new Map();
        this.io = io;
        this.autoDrawController = new autoDrawController_1.AutoDrawController(this);
        console.log('🎮 GameService initialized with AutoDrawController');
    }
    // Create or get existing game session
    async createGameSession(cashierId, sessionId, displayToken) {
        const roomName = `game:${sessionId}`;
        // CRITICAL FIX: Check if ANY game exists for this session (not just cashier-specific)
        let existingGame = await Game_1.default.findOne({
            sessionId
        });
        if (existingGame && existingGame.isConnected) {
            // Return existing active game
            const session = {
                gameId: existingGame.gameId,
                cashierId: existingGame.cashierId,
                sessionId: existingGame.sessionId,
                displayToken: existingGame.displayToken,
                roomName,
                isConnected: true,
                connectedAt: existingGame.connectedAt,
                status: existingGame.status || 'waiting' // Initialize status from existing game
            };
            this.activeGames.set(sessionId, session);
            return session;
        }
        // Create new game session with sequential game ID
        const nextGameId = await gameIdService_1.GameIdService.getNextGameId(cashierId);
        const gameId = (0, gameIdUtils_1.generateGameId)(nextGameId);
        const newGame = new Game_1.default({
            gameId,
            cashierId,
            sessionId,
            displayToken,
            status: 'waiting',
            isConnected: true,
            connectedAt: new Date(),
            lastActivity: new Date(),
            gameData: {
                calledNumbers: [],
                progress: 0,
                cartelas: 0,
                totalStack: 0,
                totalWinStack: 0,
                totalShopMargin: 0,
                totalSystemFee: 0,
                netPrizePool: 0,
                selectedCartelas: [],
                placedBetCartelas: [], // Add missing field
                winPatterns: [],
                verifiedCartelas: [], // Initialize verified cartelas tracking
                verificationResults: {}, // Initialize verification results tracking
                drawHistory: []
            },
            connectionStatus: {
                cashierConnected: true,
                displayConnected: false,
                lastCashierActivity: new Date()
            }
        });
        await newGame.save();
        const session = {
            gameId,
            cashierId,
            sessionId,
            displayToken,
            roomName,
            isConnected: true,
            connectedAt: new Date(),
            gameData: {
                calledNumbers: [],
                progress: 0,
                cartelas: 0,
                totalStack: 0,
                totalWinStack: 0,
                totalShopMargin: 0,
                totalSystemFee: 0,
                netPrizePool: 0,
                selectedCartelas: [],
                placedBetCartelas: [],
                winPatterns: [],
                verifiedCartelas: [], // Initialize verified cartelas tracking
                verificationResults: {}, // Initialize verification results tracking
                drawHistory: []
            }
        };
        this.activeGames.set(sessionId, session);
        // Emit to admin about new game session
        this.io.to('admin').emit('game_session_created', {
            gameId,
            cashierId,
            sessionId,
            displayToken,
            status: 'waiting',
            isConnected: true,
            connectedAt: new Date()
        });
        return session;
    }
    // Join room for cashier and display
    async joinGameRoom(socket, sessionId, displayToken, cashierId) {
        const roomName = `game:${sessionId}`;
        // Find existing game session
        let gameSession = this.activeGames.get(sessionId);
        if (!gameSession) {
            // No existing session in memory - check database first
            const existingGameInDb = await Game_1.default.findOne({ sessionId });
            if (existingGameInDb) {
                // Game exists in database but not in memory - restore it
                console.log(`🔄 Restoring existing game from database: ${existingGameInDb.gameId}`);
                gameSession = {
                    gameId: existingGameInDb.gameId,
                    cashierId: existingGameInDb.cashierId,
                    sessionId: existingGameInDb.sessionId,
                    displayToken: existingGameInDb.displayToken,
                    roomName,
                    isConnected: existingGameInDb.isConnected,
                    connectedAt: existingGameInDb.connectedAt,
                    status: existingGameInDb.status || 'waiting' // Add status property
                };
                this.activeGames.set(sessionId, gameSession);
            }
            else {
                // No existing game anywhere - create a new one
                if (cashierId) {
                    // Cashier is connecting - create session with cashier
                    gameSession = await this.createGameSession(cashierId, sessionId, displayToken);
                }
                else {
                    // Display is connecting first - create a waiting session
                    console.log(`📺 Display connecting first, creating waiting session for: ${sessionId}`);
                    gameSession = await this.createWaitingGameSession(sessionId, displayToken);
                }
            }
        }
        else {
            // Existing session found
            if (cashierId) {
                // Cashier joining existing session
                console.log(`👤 Cashier joining existing session: ${sessionId}`);
                // Check if this is a waiting session (gameId = "4999" or any temporary ID)
                if (gameSession.gameId === "4999" || gameSession.gameId === "0") {
                    // This is a waiting session - we need to replace it with a proper game
                    console.log(`🔄 Replacing waiting session with proper game for cashier: ${cashierId}`);
                    // Get the cashier's sequential game ID
                    const nextGameId = await gameIdService_1.GameIdService.getNextGameId(cashierId);
                    const newGameId = (0, gameIdUtils_1.generateGameId)(nextGameId);
                    // Delete the waiting game and create a new one
                    await Game_1.default.deleteOne({ sessionId });
                    // Create new game with proper game ID
                    const newGame = new Game_1.default({
                        gameId: newGameId,
                        cashierId,
                        sessionId,
                        displayToken,
                        status: 'waiting',
                        isConnected: true,
                        connectedAt: new Date(),
                        lastActivity: new Date(),
                        gameData: {
                            calledNumbers: [],
                            progress: 0,
                            cartelas: 0,
                            totalStack: 0,
                            totalWinStack: 0,
                            totalShopMargin: 0,
                            totalSystemFee: 0,
                            netPrizePool: 0,
                            selectedCartelas: [],
                            placedBetCartelas: [], // Add missing field
                            winPatterns: [],
                            verifiedCartelas: [], // Initialize verified cartelas tracking
                            verificationResults: {}, // Initialize verification results tracking
                            drawHistory: []
                        },
                        connectionStatus: {
                            cashierConnected: true,
                            displayConnected: true,
                            lastCashierActivity: new Date(),
                            lastDisplayActivity: new Date()
                        }
                    });
                    await newGame.save();
                    console.log(`✅ Created new game with proper game ID: ${newGameId}`);
                    // Update the game session
                    gameSession.cashierId = cashierId;
                    gameSession.gameId = newGameId;
                    gameSession.status = 'waiting'; // Add status property
                    this.activeGames.set(sessionId, gameSession);
                }
                else {
                    // This is an existing game with a proper game ID
                    console.log(`🔄 Updating existing game session for cashier: ${cashierId}`);
                    // Update the session with cashier info
                    await Game_1.default.findOneAndUpdate({ sessionId }, {
                        cashierId,
                        lastActivity: new Date(),
                        'connectionStatus.cashierConnected': true,
                        'connectionStatus.lastCashierActivity': new Date()
                    });
                    // Update the game session
                    gameSession.cashierId = cashierId;
                    this.activeGames.set(sessionId, gameSession);
                }
                // Broadcast updated game data to all clients in the room
                await this.broadcastGameDataUpdate(sessionId);
                // No need to restore manually - the frontend can check current status
            }
            else {
                // Display joining existing session
                console.log(`📺 Display joining existing session: ${sessionId}`);
                await Game_1.default.findOneAndUpdate({ sessionId }, {
                    lastActivity: new Date(),
                    'connectionStatus.displayConnected': true,
                    'connectionStatus.lastDisplayActivity': new Date()
                });
            }
        }
        // Join the room
        socket.join(roomName);
        // Emit room joined event
        socket.emit('room_joined', {
            gameId: gameSession.gameId,
            roomName,
            sessionId,
            displayToken
        });
        // Notify others in the room
        socket.to(roomName).emit('user_joined_room', {
            gameId: gameSession.gameId,
            sessionId,
            displayToken,
            timestamp: new Date()
        });
        // Emit connection status update
        await this.emitConnectionStatusUpdate(sessionId);
        return gameSession;
    }
    // Create a waiting game session (for display connecting first)
    async createWaitingGameSession(sessionId, displayToken) {
        const roomName = `game:${sessionId}`;
        // Use a temporary game ID for waiting sessions (no cashier yet)
        // This will be updated when the cashier connects
        const gameId = '4999'; // Use 9999 as temporary ID (will be updated when cashier connects)
        const newGame = new Game_1.default({
            gameId,
            cashierId: null, // No cashier yet
            sessionId,
            displayToken,
            status: 'waiting',
            isConnected: true,
            connectedAt: new Date(),
            lastActivity: new Date(),
            gameData: {
                calledNumbers: [],
                progress: 0,
                cartelas: 0,
                totalStack: 0,
                totalWinStack: 0,
                totalShopMargin: 0,
                totalSystemFee: 0,
                netPrizePool: 0,
                selectedCartelas: [],
                placedBetCartelas: [], // Add missing field
                winPatterns: [],
                verifiedCartelas: [], // Initialize verified cartelas tracking
                verificationResults: {}, // Initialize verification results tracking
                drawHistory: []
            },
            connectionStatus: {
                cashierConnected: false,
                displayConnected: true,
                lastDisplayActivity: new Date()
            }
        });
        await newGame.save();
        const session = {
            gameId,
            cashierId: null, // Will be updated when cashier connects
            sessionId,
            displayToken,
            roomName,
            isConnected: true,
            connectedAt: new Date(),
            status: 'waiting' // Initialize status for new game
        };
        this.activeGames.set(sessionId, session);
        // Emit to admin about new waiting game session
        this.io.to('admin').emit('game_session_created', {
            gameId,
            cashierId: null,
            sessionId,
            displayToken,
            status: 'waiting',
            isConnected: true,
            connectedAt: new Date()
        });
        return session;
    }
    // Broadcast game data update to all clients in the room
    async broadcastGameDataUpdate(sessionId) {
        try {
            const gameData = await this.getGameData(sessionId);
            if (gameData) {
                const gameSession = this.activeGames.get(sessionId);
                if (gameSession) {
                    // Emit to all clients in the room
                    this.io.to(gameSession.roomName).emit('game_data_updated', gameData);
                    // Also emit to admin
                    this.io.to('admin').emit('game_data_updated', {
                        ...gameData,
                        sessionId,
                        cashierId: gameSession.cashierId
                    });
                }
            }
        }
        catch (error) {
            console.error('Error broadcasting game data update:', error);
        }
    }
    // Update game status
    async updateGameStatus(sessionId, status, gameData) {
        try {
            const gameSession = this.activeGames.get(sessionId);
            if (gameSession) {
                gameSession.status = status;
                // Update game data if provided
                if (gameData) {
                    gameSession.gameData = {
                        ...gameSession.gameData,
                        ...gameData
                    };
                }
                // Update database
                const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                await Game.findOneAndUpdate({ sessionId }, {
                    status,
                    'gameData': gameSession.gameData,
                    lastActivity: new Date()
                }, { new: true });
                console.log(`🎮 Game status updated to ${status} for session ${sessionId}`);
                // CRITICAL FIX: Emit game status change event to all clients
                this.io.to(`game:${sessionId}`).emit('game_status_changed', {
                    sessionId,
                    newStatus: status,
                    gameData: gameSession.gameData,
                    timestamp: new Date()
                });
                // Also emit to display and cashier rooms
                this.io.to(`display:${sessionId}`).emit('game_status_changed', {
                    sessionId,
                    newStatus: status,
                    gameData: gameSession.gameData,
                    timestamp: new Date()
                });
                this.io.to(`cashier:*`).emit('game_status_changed', {
                    sessionId,
                    newStatus: status,
                    gameData: gameSession.gameData,
                    timestamp: new Date()
                });
            }
            else {
                console.log(`⚠️ No active game session found for session ${sessionId}`);
            }
        }
        catch (error) {
            console.error('❌ Error updating game status:', error);
            throw error;
        }
    }
    // Start game with selected cartelas
    async startGame(sessionId, selectedCartelas) {
        try {
            const gameSession = this.activeGames.get(sessionId);
            if (!gameSession) {
                throw new Error('Game session not found');
            }
            // NEW RULE: Check if at least 3 tickets have placed bets before starting the game
            const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
            const currentGame = await Game.findOne({ sessionId });
            if (!currentGame) {
                throw new Error('Game not found in database');
            }
            // Check if there are at least 3 placed bets
            const placedBetsCount = currentGame.gameData?.placedBetCartelas?.length || 0;
            const hasEnoughPlacedBets = placedBetsCount >= 3;
            if (!hasEnoughPlacedBets) {
                console.log(`❌ Game start rejected: Only ${placedBetsCount} tickets with placed bets found for session ${sessionId}, need at least 3`);
                throw new Error(`Cannot start game: At least 3 tickets must have placed bets (currently ${placedBetsCount})`);
            }
            console.log(`✅ Game start validation passed: Found ${placedBetsCount} tickets with placed bets (minimum 3 required)`);
            // Get the cashier's active win patterns
            let activeWinPatterns = [];
            if (gameSession.cashierId) {
                try {
                    const { WinPattern } = await Promise.resolve().then(() => __importStar(require('../models/WinPattern')));
                    activeWinPatterns = await WinPattern.find({
                        cashierId: gameSession.cashierId,
                        isActive: true
                    }).select('name pattern');
                    console.log(`🎯 Found ${activeWinPatterns.length} active win patterns for game start`);
                }
                catch (error) {
                    console.error('❌ Error fetching win patterns for game start:', error);
                }
            }
            // Update game status to active
            await Game.findOneAndUpdate({ sessionId }, {
                $set: {
                    status: 'active',
                    'gameData.gameStartTime': new Date(),
                    'gameData.selectedCartelas': selectedCartelas,
                    'gameData.winPatterns': activeWinPatterns, // Store win patterns in game data
                    lastActivity: new Date()
                }
            });
            // Update local session
            if (gameSession.gameData) {
                gameSession.gameData = {
                    ...gameSession.gameData,
                    selectedCartelas,
                    winPatterns: activeWinPatterns,
                    gameStartTime: new Date(),
                };
            }
            else {
                gameSession.gameData = {
                    calledNumbers: [],
                    progress: 0,
                    cartelas: 0,
                    totalStack: 0,
                    totalWinStack: 0,
                    totalShopMargin: 0,
                    totalSystemFee: 0,
                    netPrizePool: 0,
                    selectedCartelas,
                    placedBetCartelas: [],
                    winPatterns: activeWinPatterns,
                    drawHistory: [],
                    gameStartTime: new Date()
                };
            }
            // Update the local session status
            gameSession.status = 'active';
            console.log(`🎮 Game started with ${selectedCartelas.length} selected cartelas and ${activeWinPatterns.length} win patterns`);
            // Broadcast game start to all clients in the room
            this.io.to(gameSession.roomName).emit('game_started', {
                gameId: gameSession.gameId,
                selectedCartelas,
                winPatterns: activeWinPatterns,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('❌ Error starting game:', error);
            throw error;
        }
    }
    // Record a number draw in real-time
    async recordNumberDraw(sessionId, number, drawnBy = 'manual') {
        const gameSession = this.activeGames.get(sessionId);
        if (!gameSession) {
            console.log(`Draw operation rejected: No game session found for ${sessionId}`);
            return;
        }
        const game = await Game_1.default.findOne({ sessionId });
        if (!game) {
            console.log(`Draw operation rejected: No game found in database for ${sessionId}`);
            return;
        }
        // Only allow draws when game is active
        if (game.status !== 'active') {
            console.log(`Draw operation rejected: Game status is ${game.status}, must be 'active'`);
            // Notify the room about the rejection
            this.io.to(gameSession.roomName).emit('draw_rejected', {
                reason: `Game must be active to draw numbers. Current status: ${game.status}`,
                gameStatus: game.status
            });
            return;
        }
        // Enhanced number validation using NumberPoolService
        if (drawnBy === 'auto') {
            const cashierId = gameSession.cashierId;
            if (cashierId) {
                // For auto draws, we need to check if the number was drawn from the pool
                // The number might not be "available" anymore because it was just drawn
                const drawnNumbers = numberPoolService_1.numberPoolService.getDrawnNumbers(cashierId);
                if (!drawnNumbers.includes(number)) {
                    console.log(`Number ${number} was not drawn from pool for cashier ${cashierId}`);
                    return;
                }
            }
        }
        const calledNumbers = game.gameData?.calledNumbers || [];
        if (calledNumbers.includes(number)) {
            console.log(`Number ${number} already called`);
            return;
        }
        const drawRecord = {
            number,
            timestamp: new Date(),
            drawnBy
        };
        // Use $set to update gameData fields to avoid conflicts
        await Game_1.default.findOneAndUpdate({ sessionId }, {
            $set: {
                'gameData.calledNumbers': [...calledNumbers, number],
                'gameData.currentNumber': number,
                'gameData.progress': calledNumbers.length + 1,
                'gameData.lastDrawTime': new Date(),
                lastActivity: new Date()
            },
            $push: { 'gameData.drawHistory': drawRecord }
        }, { new: true });
        // Emit to room
        this.io.to(gameSession.roomName).emit('number_drawn', {
            gameId: gameSession.gameId,
            number,
            drawnBy,
            progress: calledNumbers.length + 1,
            timestamp: new Date()
        });
        // Emit to admin
        this.io.to('admin').emit('number_drawn', {
            gameId: gameSession.gameId,
            cashierId: gameSession.cashierId,
            sessionId,
            number,
            drawnBy,
            progress: calledNumbers.length + 1,
            timestamp: new Date()
        });
        // Broadcast updated game data
        await this.broadcastGameDataUpdate(sessionId);
        // Update number pool if this was an auto draw
        if (drawnBy === 'auto' && gameSession.cashierId) {
            // The number pool is already updated by the AutoDrawController
            // This ensures consistency between game state and pool state
        }
    }
    // ===== AUTO DRAW CONTROL METHODS =====
    /**
     * Get the auto draw controller instance
     */
    getAutoDrawController() {
        return this.autoDrawController;
    }
    /**
     * Initialize auto draw for a cashier
     */
    async initializeAutoDraw(cashierId, sessionId, config) {
        // Save configuration to database for persistence
        if (config) {
            await this.saveAutoDrawConfig(cashierId, sessionId, config);
        }
        // Initialize the controller
        this.autoDrawController.initializeCashierController(cashierId, sessionId, config);
        // Sync number pool with current game state
        await this.syncNumberPoolWithGame(cashierId, sessionId);
        console.log(`🎮 Auto draw initialized for cashier ${cashierId} in session ${sessionId}`);
    }
    /**
     * Sync number pool with current game state
     */
    async syncNumberPoolWithGame(cashierId, sessionId) {
        try {
            const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
            const game = await Game.findOne({ sessionId });
            if (game?.gameData?.calledNumbers) {
                const calledNumbers = game.gameData.calledNumbers;
                numberPoolService_1.numberPoolService.syncPoolWithGameState(cashierId, calledNumbers);
                console.log(`🔄 Synced number pool with game state: ${calledNumbers.length} numbers already called`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to sync number pool with game state:`, error);
        }
    }
    /**
     * Save auto draw configuration to database
     */
    async saveAutoDrawConfig(cashierId, sessionId, config) {
        try {
            const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
            await Game.findOneAndUpdate({ sessionId }, {
                $set: {
                    'gameData.autoDrawConfig': {
                        cashierId,
                        config,
                        lastUpdated: new Date()
                    }
                }
            }, { upsert: true });
            console.log(`💾 Auto draw config saved for cashier ${cashierId} in session ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Failed to save auto draw config:`, error);
        }
    }
    /**
     * Load auto draw configuration from database
     */
    async loadAutoDrawConfig(cashierId, sessionId) {
        try {
            const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
            const game = await Game.findOne({ sessionId });
            if (game?.gameData?.autoDrawConfig?.cashierId === cashierId) {
                console.log(`📂 Auto draw config loaded for cashier ${cashierId} in session ${sessionId}`);
                return game.gameData.autoDrawConfig.config;
            }
            return null;
        }
        catch (error) {
            console.error(`❌ Failed to load auto draw config:`, error);
            return null;
        }
    }
    /**
     * Start auto draw for a cashier
     */
    async startAutoDraw(cashierId, sessionId) {
        const result = await this.autoDrawController.startAutoDraw(cashierId, sessionId);
        if (result) {
            console.log(`🎮 Auto draw started for cashier ${cashierId} in session ${sessionId}`);
        }
        return result;
    }
    /**
     * Stop auto draw for a cashier
     */
    stopAutoDraw(cashierId) {
        const result = this.autoDrawController.stopAutoDraw(cashierId);
        if (result) {
            console.log(`🎮 Auto draw stopped for cashier ${cashierId}`);
        }
        return result;
    }
    /**
     * Update auto draw configuration for a cashier
     */
    async updateAutoDrawConfig(cashierId, config, sessionId) {
        const result = this.autoDrawController.updateCashierConfig(cashierId, config, sessionId || '');
        if (result && sessionId) {
            // Save updated configuration to database
            await this.saveAutoDrawConfig(cashierId, sessionId, config);
            console.log(`🎮 Auto draw config updated for cashier ${cashierId}`);
        }
        return result;
    }
    /**
     * Get auto draw statistics for a cashier
     */
    getAutoDrawStats(cashierId) {
        return this.autoDrawController.getCashierStats(cashierId);
    }
    /**
     * Get number pool statistics for a cashier
     */
    getNumberPoolStats(cashierId) {
        return numberPoolService_1.numberPoolService.getCashierPoolStats(cashierId);
    }
    /**
     * Shuffle number pool for a cashier
     */
    shuffleNumberPool(cashierId) {
        numberPoolService_1.numberPoolService.shuffleCashierPool(cashierId);
        console.log(`🔄 Number pool shuffled for cashier ${cashierId}`);
    }
    /**
     * Clean up auto draw for a cashier
     */
    cleanupAutoDraw(cashierId) {
        this.autoDrawController.cleanupCashierController(cashierId);
        console.log(`🧹 Auto draw cleaned up for cashier ${cashierId}`);
    }
    // Update connection status
    async updateConnectionStatus(sessionId, type, connected) {
        const updateData = {
            lastActivity: new Date()
        };
        if (type === 'cashier') {
            updateData['connectionStatus.cashierConnected'] = connected;
            updateData['connectionStatus.lastCashierActivity'] = new Date();
        }
        else {
            updateData['connectionStatus.displayConnected'] = connected;
            updateData['connectionStatus.lastDisplayActivity'] = new Date();
        }
        // Update the database
        const updatedGame = await Game_1.default.findOneAndUpdate({ sessionId }, updateData, { new: true });
        // Log the update for debugging
        if (updatedGame) {
            console.log(`🔄 Connection status updated for ${sessionId}:`);
            console.log(`   - Cashier connected: ${updatedGame.connectionStatus?.cashierConnected}`);
            console.log(`   - Display connected: ${updatedGame.connectionStatus?.displayConnected}`);
        }
        // Emit the updated connection status to all clients
        await this.emitConnectionStatusUpdate(sessionId);
    }
    // Emit connection status update using enhanced real-time service
    async emitConnectionStatusUpdate(sessionId) {
        try {
            const gameSession = this.activeGames.get(sessionId);
            if (!gameSession)
                return;
            const game = await Game_1.default.findOne({ sessionId });
            if (!game)
                return;
            // Use the enhanced real-time service for immediate updates
            const { RealTimeUpdateService } = await Promise.resolve().then(() => __importStar(require('./realTimeUpdateService')));
            const realTimeService = new RealTimeUpdateService(this.io);
            // Immediate connection status update
            realTimeService.emitConnectionStatusUpdate(sessionId, {
                gameId: gameSession.gameId,
                cashierConnected: game.connectionStatus?.cashierConnected || false,
                displayConnected: game.connectionStatus?.displayConnected || false,
                lastCashierActivity: game.connectionStatus?.lastCashierActivity,
                lastDisplayActivity: game.connectionStatus?.lastDisplayActivity
            });
            // Also emit the specific display connection status event for better client handling
            this.io.to(gameSession.roomName).emit('display:connection_status', {
                connected: game.connectionStatus?.displayConnected || false,
                sessionId
            });
            // Emit to admin
            this.io.to('admin').emit('connection_status_update', {
                gameId: gameSession.gameId,
                sessionId,
                cashierConnected: game.connectionStatus?.cashierConnected || false,
                displayConnected: game.connectionStatus?.displayConnected || false,
                lastCashierActivity: game.connectionStatus?.lastCashierActivity,
                lastDisplayActivity: game.connectionStatus?.lastDisplayActivity,
                cashierId: gameSession.cashierId
            });
            console.log(`⚡ IMMEDIATE connection status update emitted for ${sessionId}: display=${game.connectionStatus?.displayConnected || false}, cashier=${game.connectionStatus?.cashierConnected || false}`);
        }
        catch (error) {
            console.error(`Error in enhanced connection status update for session ${sessionId}:`, error);
        }
    }
    // Disconnect game session
    async disconnectGameSession(sessionId) {
        const gameSession = this.activeGames.get(sessionId);
        if (!gameSession)
            return;
        // Update database
        await Game_1.default.findOneAndUpdate({ sessionId }, {
            isConnected: false,
            disconnectedAt: new Date(),
            lastActivity: new Date(),
            'connectionStatus.cashierConnected': false,
            'connectionStatus.displayConnected': false
        });
        // Remove from active games
        this.activeGames.delete(sessionId);
        // Emit to admin
        this.io.to('admin').emit('game_session_disconnected', {
            gameId: gameSession.gameId,
            cashierId: gameSession.cashierId,
            sessionId,
            isConnected: false,
            disconnectedAt: new Date()
        });
    }
    // Reset game completely - clear all data and prepare for new game
    async resetGame(sessionId) {
        const gameSession = this.activeGames.get(sessionId);
        if (!gameSession)
            return;
        // Reset all game data in database but keep the same game ID
        await Game_1.default.findOneAndUpdate({ sessionId }, {
            $set: {
                // Keep the same gameId - don't change it
                status: 'waiting',
                'gameData.calledNumbers': [],
                'gameData.currentNumber': undefined,
                'gameData.progress': 0,
                'gameData.cartelas': 0,
                'gameData.totalStack': 0,
                'gameData.totalWinStack': 0,
                'gameData.gameStartTime': undefined,
                'gameData.gameEndTime': undefined,
                'gameData.lastDrawTime': undefined,
                'gameData.drawHistory': [],
                'gameData.selectedCartelas': [],
                'gameData.winPatterns': [],
                'gameData.placedBetCartelas': [],
                'gameData.verifiedCartelas': [],
                'gameData.verificationResults': {},
                lastActivity: new Date()
            }
        }, { new: true });
        // Update local session data
        if (gameSession.gameData) {
            gameSession.gameData.calledNumbers = [];
            gameSession.gameData.currentNumber = undefined;
            gameSession.gameData.progress = 0;
            gameSession.gameData.cartelas = 0;
            gameSession.gameData.totalStack = 0;
            gameSession.gameData.totalWinStack = 0;
            gameSession.gameData.gameStartTime = undefined;
            gameSession.gameData.gameEndTime = undefined;
            gameSession.gameData.lastDrawTime = undefined;
            gameSession.gameData.drawHistory = [];
            gameSession.gameData.selectedCartelas = [];
            gameSession.gameData.winPatterns = [];
            gameSession.gameData.placedBetCartelas = [];
            gameSession.gameData.verifiedCartelas = [];
            gameSession.gameData.verificationResults = {};
        }
        // Update local session status
        gameSession.status = 'waiting';
        // Keep the same game ID in the session
        this.activeGames.set(sessionId, gameSession);
        // Emit reset event to all clients in the room
        this.io.to(gameSession.roomName).emit('game_reset', {
            gameId: gameSession.gameId,
            status: 'waiting',
            calledNumbers: [],
            currentNumber: undefined,
            progress: 0,
            cartelas: 0,
            totalStack: 0,
            totalWinStack: 0,
            timestamp: new Date()
        });
        // Emit to admin
        this.io.to('admin').emit('game_reset', {
            gameId: gameSession.gameId,
            cashierId: gameSession.cashierId,
            sessionId,
            status: 'waiting',
            timestamp: new Date()
        });
        // Broadcast updated game data
        await this.broadcastGameDataUpdate(sessionId);
        console.log(`🔄 Game reset for session ${sessionId} - Game ID: ${(0, gameIdUtils_1.formatGameIdForDisplay)(gameSession.gameId)}`);
    }
    // Get active games for admin
    async getActiveGames() {
        const activeGames = await Game_1.default.find({ isConnected: true })
            .populate('cashierId', 'fullName username')
            .sort({ lastActivity: -1 });
        return activeGames.map(game => ({
            gameId: game.gameId,
            cashierId: game.cashierId,
            cashierName: game.cashierId?.fullName || 'Unknown',
            sessionId: game.sessionId,
            displayToken: game.displayToken,
            status: game.status,
            isConnected: game.isConnected,
            connectedAt: game.connectedAt,
            lastActivity: game.lastActivity,
            gameData: game.gameData,
            connectionStatus: game.connectionStatus
        }));
    }
    // Get game session by sessionId
    getGameSession(sessionId) {
        return this.activeGames.get(sessionId);
    }
    // Get all active sessions
    getAllActiveSessions() {
        return Array.from(this.activeGames.values());
    }
    // Get game data for cashier
    async getGameData(sessionId) {
        const game = await Game_1.default.findOne({ sessionId });
        if (!game)
            return null;
        return {
            id: (0, gameIdUtils_1.formatGameIdForDisplay)(game.gameId),
            gameId: game.gameId,
            status: game.status,
            gameData: game.gameData,
            connectionStatus: game.connectionStatus,
            lastActivity: game.lastActivity
        };
    }
}
exports.default = GameService;
//# sourceMappingURL=gameService.js.map