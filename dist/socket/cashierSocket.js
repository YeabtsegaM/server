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
exports.CashierSocketHandler = void 0;
const Game_1 = __importDefault(require("../models/Game"));
const printerService_1 = require("../utils/printerService");
class CashierSocketHandler {
    constructor(gameService, io) {
        this.selectedCartelas = new Map();
        this.lastEmittedSelections = new Map(); // Track last emitted selections
        // Performance optimization: Cache game data to reduce database queries
        this.gameCache = new Map();
        this.CACHE_TTL = 1000; // 1 second cache TTL
        // Performance optimization: Batch database operations
        this.pendingDbUpdates = new Map();
        this.BATCH_DELAY = 100; // 100ms batch delay
        // Performance optimization: Track last socket check time to reduce overhead
        this.lastSocketCheckTime = new Map();
        this.gameService = gameService;
        this.io = io;
    }
    // Performance optimization: Get game data with caching
    async getGameData(sessionId, forceRefresh = false) {
        const now = Date.now();
        const cached = this.gameCache.get(sessionId);
        if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_TTL) {
            return cached.data;
        }
        try {
            const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
            const game = await Game.findOne({ sessionId });
            if (game) {
                this.gameCache.set(sessionId, { data: game, timestamp: now });
            }
            return game;
        }
        catch (error) {
            console.error('Error getting game data:', error);
            return null;
        }
    }
    // Performance optimization: Batch database updates
    scheduleDbUpdate(sessionId, update) {
        if (!this.pendingDbUpdates.has(sessionId)) {
            this.pendingDbUpdates.set(sessionId, { updates: [], timer: null });
        }
        const pending = this.pendingDbUpdates.get(sessionId);
        pending.updates.push(update);
        if (pending.timer) {
            clearTimeout(pending.timer);
        }
        pending.timer = setTimeout(async () => {
            try {
                const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                const updates = pending.updates;
                pending.updates = [];
                // Combine all updates into a single operation
                const combinedUpdate = { lastActivity: new Date() };
                updates.forEach(update => {
                    Object.assign(combinedUpdate, update);
                });
                await Game.findOneAndUpdate({ sessionId }, combinedUpdate, { new: true });
                // Clear cache after update
                this.gameCache.delete(sessionId);
            }
            catch (error) {
                console.error('Error in batched database update:', error);
            }
        }, this.BATCH_DELAY);
    }
    async handleConnection(socket, cashierId, sessionId) {
        if (!cashierId) {
            socket.emit('cashier:unauthorized');
            socket.disconnect();
            return;
        }
        // Validate JWT token
        const token = socket.handshake.query.token;
        if (!token) {
            socket.emit('cashier:unauthorized');
            socket.disconnect();
            return;
        }
        try {
            const jwt = (await Promise.resolve().then(() => __importStar(require('jsonwebtoken')))).default;
            const JWT_SECRET = process.env.JWT_SECRET || 'bingo2025-super-secret-jwt-key-for-admin-authentication';
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded || decoded.id !== cashierId) {
                socket.emit('cashier:unauthorized');
                socket.disconnect();
                return;
            }
            const Cashier = (await Promise.resolve().then(() => __importStar(require('../models/Cashier')))).default;
            const cashier = await Cashier.findById(cashierId);
            if (!cashier || !cashier.isActive) {
                socket.emit('cashier:unauthorized');
                socket.disconnect();
                return;
            }
            // Performance optimization: Use batched update for cashier status
            this.scheduleDbUpdate(cashierId, {
                isConnected: true,
                lastActivity: new Date()
            });
            // Join the cashier room for this session
            const cashierRoomName = `cashier:${cashierId}`;
            socket.join(cashierRoomName);
            // CRITICAL: Check display connection status immediately and notify cashier
            try {
                const currentGame = await this.getGameData(sessionId);
                if (currentGame && currentGame.connectionStatus) {
                    const displayConnected = currentGame.connectionStatus.displayConnected || false;
                    const cashierConnected = currentGame.connectionStatus.cashierConnected || false;
                    // Emit current connection status to the cashier
                    socket.emit('display:connection_status', {
                        connected: displayConnected,
                        sessionId: sessionId,
                        cashierId: cashierId,
                        timestamp: new Date()
                    });
                    // Also emit comprehensive status
                    socket.emit('connection:status_update', {
                        display: {
                            connected: displayConnected,
                            sessionId: sessionId,
                            timestamp: new Date()
                        },
                        cashier: {
                            connected: cashierConnected,
                            sessionId: sessionId,
                            timestamp: new Date()
                        },
                        game: {
                            gameId: currentGame.gameId,
                            status: currentGame.status,
                            timestamp: new Date()
                        }
                    });
                }
            }
            catch (error) {
                console.error('⚠️ Could not check connection status for reconnected cashier:', error);
            }
            // Join game room if sessionId is provided
            if (sessionId) {
                // Restore selected cartelas from database for this session
                try {
                    const game = await this.getGameData(sessionId);
                    if (game && game.gameData && game.gameData.selectedCartelas) {
                        // Restore selections from database - ensure type safety
                        const selectedCartelas = game.gameData.selectedCartelas;
                        const selectionsFromDB = new Set(selectedCartelas);
                        this.selectedCartelas.set(sessionId, selectionsFromDB);
                        // Send current selections to the newly connected cashier
                        socket.emit('cartela_selections_response', {
                            selectedCartelas: Array.from(selectionsFromDB),
                            timestamp: new Date()
                        });
                    }
                    else {
                        // Initialize empty selections set
                        this.selectedCartelas.set(sessionId, new Set());
                    }
                }
                catch (error) {
                    console.error('Error restoring cartela selections from database:', error);
                    // Fallback to empty selections
                    this.selectedCartelas.set(sessionId, new Set());
                }
                // Also clear last emitted selections
                if (this.lastEmittedSelections.has(sessionId)) {
                    this.lastEmittedSelections.delete(sessionId);
                }
                // CRITICAL FIX: Join the game room first
                await this.joinGameRoom(socket, sessionId, cashierId);
                // CRITICAL FIX: Join the display room to see display connection status
                socket.join(`display:${sessionId}`);
                // CRITICAL FIX: Also join the game room to get all game-related events
                socket.join(`game:${sessionId}`);
                // Check if display is already connected for this session
                const displaySockets = await this.io.in(`display:${sessionId}`).fetchSockets();
                const isDisplayConnected = displaySockets.length > 0;
                // Get the actual connection status from the database for more reliability
                const game = await this.getGameData(sessionId);
                const displayConnected = game?.connectionStatus?.displayConnected || isDisplayConnected;
                // Emit connection status to the cashier
                socket.emit('display:connection_status', {
                    connected: displayConnected,
                    sessionId
                });
                // Notify display that cashier has joined
                this.io.to(`display:${sessionId}`).emit('cashier:joined', {
                    cashierId,
                    sessionId,
                    timestamp: new Date()
                });
                // Emit cashier connection status to display
                this.io.to(`display:${sessionId}`).emit('cashier:connection_status', {
                    connected: true,
                    sessionId
                });
                // Also update the database connection status to ensure consistency
                if (game) {
                    // Performance optimization: Use batched update for connection status
                    this.scheduleDbUpdate(sessionId, {
                        'connectionStatus.cashierConnected': true,
                        'connectionStatus.displayConnected': displayConnected,
                        'connectionStatus.lastCashierActivity': new Date()
                    });
                    // Broadcast the updated connection status to all clients
                    await this.gameService.emitConnectionStatusUpdate(sessionId);
                }
            }
            // CRITICAL: Set up event handlers for this socket
            this.setupEventHandlers(socket, cashierId, sessionId);
            // CRITICAL: Set up connection status check
            this.setupConnectionStatusCheck(socket, cashierId, sessionId);
            // REAL-TIME SYNC: Start automatic data sync for cashier
            this.setupRealTimeSync(socket, sessionId);
            // Emit connection update to admin
            this.io.to('admin').emit('cashier_connection_update', {
                cashierId,
                isConnected: true
            });
        }
        catch (error) {
            console.error('Error validating cashier connection:', error);
            socket.emit('cashier:unauthorized');
            socket.disconnect();
        }
    }
    /**
     * Calculate total win stack based on game progress and winning patterns
     */
    calculateTotalWinStack(gameData) {
        if (!gameData || !gameData.placedBetCartelas || gameData.placedBetCartelas.length === 0) {
            return 0;
        }
        // For now, return 0 since win calculation depends on game progress and winning patterns
        // This should be enhanced based on the actual game rules
        return 0;
    }
    setupEventHandlers(socket, cashierId, sessionId) {
        // Room management
        socket.on('join_cashier_room', (data) => {
            socket.join(`cashier:${data.cashierId}`);
        });
        socket.on('leave_cashier_room', (data) => {
            socket.leave(`cashier:${data.cashierId}`);
        });
        // Verification modal control
        socket.on('close-verification-modal', (data) => {
            if (data.sessionId && data.sessionId === sessionId) {
                // Forward the event to the display room
                this.io.to(`display:${sessionId}`).emit('close-verification-modal', {
                    sessionId: sessionId,
                    cashierId: cashierId,
                    timestamp: new Date()
                });
            }
        });
        // Game events
        socket.on('draw_number', async (data) => {
            if (sessionId && data.number) {
                // Performance optimization: Use cached game data
                const game = await this.getGameData(sessionId);
                if (game && game.status === 'active') {
                    await this.gameService.recordNumberDraw(sessionId, data.number, 'manual');
                }
                else {
                    // Notify the cashier that draw is not possible
                    socket.emit('draw_rejected', {
                        reason: `Game must be active to draw numbers. Current status: ${game?.status || 'unknown'}`,
                        gameStatus: game?.status || 'unknown'
                    });
                }
            }
        });
        // Enhanced Auto Draw events
        socket.on('auto_draw_initialize', async (data) => {
            if (sessionId && cashierId) {
                try {
                    // Load saved configuration if no config provided
                    let configToUse = data.config;
                    if (!configToUse) {
                        configToUse = await this.gameService.loadAutoDrawConfig(cashierId, sessionId);
                    }
                    await this.gameService.initializeAutoDraw(cashierId, sessionId, configToUse);
                    socket.emit('auto_draw_initialized', {
                        success: true,
                        cashierId,
                        sessionId,
                        config: configToUse
                    });
                }
                catch (error) {
                    console.error(`❌ Failed to initialize auto draw:`, error);
                    socket.emit('auto_draw_initialized', {
                        success: false,
                        cashierId,
                        sessionId,
                        error: 'Failed to initialize auto draw'
                    });
                }
            }
        });
        socket.on('auto_draw_start', async () => {
            if (sessionId && cashierId) {
                const success = await this.gameService.startAutoDraw(cashierId, sessionId);
                socket.emit('auto_draw_started', {
                    success,
                    cashierId,
                    sessionId
                });
                if (success) {
                    // Immediately send updated stats to show the active state
                    setTimeout(() => {
                        const stats = this.gameService.getAutoDrawStats(cashierId);
                        const poolStats = this.gameService.getNumberPoolStats(cashierId);
                        socket.emit('auto_draw_stats', {
                            cashierId,
                            autoDrawStats: stats,
                            poolStats
                        });
                    }, 100);
                }
                else {
                }
            }
        });
        socket.on('auto_draw_stop', () => {
            if (cashierId) {
                const success = this.gameService.stopAutoDraw(cashierId);
                socket.emit('auto_draw_stopped', {
                    success,
                    cashierId
                });
                if (success) {
                }
            }
        });
        socket.on('auto_draw_config_update', async (data) => {
            if (cashierId && sessionId) {
                try {
                    const success = await this.gameService.updateAutoDrawConfig(cashierId, data.config, sessionId);
                    socket.emit('auto_draw_config_updated', {
                        success,
                        cashierId,
                        config: data.config
                    });
                    if (success) {
                    }
                }
                catch (error) {
                    console.error(`❌ Failed to update auto draw config:`, error);
                    socket.emit('auto_draw_config_updated', {
                        success: false,
                        cashierId,
                        error: 'Failed to update configuration'
                    });
                }
            }
        });
        socket.on('get_auto_draw_stats', () => {
            if (cashierId) {
                const stats = this.gameService.getAutoDrawStats(cashierId);
                const poolStats = this.gameService.getNumberPoolStats(cashierId);
                // Ensure nextDrawTime is properly set if auto draw is active
                if (stats && stats.isActive && !stats.nextDrawTime) {
                    // Calculate next draw time based on current time + interval
                    const controller = this.gameService.getAutoDrawController();
                    if (controller) {
                        const cashierStats = controller.getCashierStats(cashierId);
                        if (cashierStats && cashierStats.nextDrawTime) {
                            stats.nextDrawTime = cashierStats.nextDrawTime;
                        }
                        else {
                            // Fallback: calculate next draw time from last draw + interval
                            const lastDraw = cashierStats?.lastDrawTime;
                            if (lastDraw) {
                                const lastDrawTime = new Date(lastDraw).getTime();
                                const interval = 5000; // Fixed 5-second interval
                                stats.nextDrawTime = new Date(lastDrawTime + interval);
                            }
                        }
                    }
                }
                socket.emit('auto_draw_stats', {
                    cashierId,
                    autoDrawStats: stats,
                    poolStats
                });
            }
        });
        socket.on('shuffle_number_pool', () => {
            if (cashierId && sessionId) {
                try {
                    // Shuffle the number pool
                    this.gameService.shuffleNumberPool(cashierId);
                    // Emit to cashier
                    socket.emit('number_pool_shuffled', {
                        success: true,
                        cashierId
                    });
                    // Emit to display for 3D animation
                    this.io.to(`display:${sessionId}`).emit('display:shuffle_animation', {
                        cashierId,
                        sessionId,
                        timestamp: new Date(),
                        action: 'start'
                    });
                    // Emit completion event after 5 seconds (typical shuffle duration)
                    setTimeout(() => {
                        console.log(`🎲 Emitting shuffle completion event to display room: display:${sessionId}`);
                        this.io.to(`display:${sessionId}`).emit('display:shuffle_animation', {
                            cashierId,
                            sessionId,
                            timestamp: new Date(),
                            action: 'complete'
                        });
                        // Notify cashier that shuffle is complete
                        socket.emit('shuffle_completed', {
                            success: true,
                            cashierId,
                            message: '3D shuffle completed successfully'
                        });
                    }, 5000);
                }
                catch (error) {
                    console.error(`❌ Failed to start shuffle:`, error);
                    socket.emit('number_pool_shuffled', {
                        success: false,
                        cashierId,
                        error: 'Failed to start shuffle'
                    });
                }
            }
        });
        socket.on('start_game', async (data) => {
            if (sessionId) {
                try {
                    // Performance optimization: Use cached game data
                    const game = await this.getGameData(sessionId);
                    const displayConnected = game?.connectionStatus?.displayConnected || false;
                    // NEW RULE: Check if at least 1 ticket has placed a bet before starting the game
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const currentGame = await Game.findOne({ sessionId });
                    if (!currentGame) {
                        socket.emit('game_start_error', {
                            message: 'Game not found',
                            sessionId
                        });
                        return;
                    }
                    // Check if there are at least 3 placed bets
                    const placedBetsCount = currentGame.gameData?.placedBetCartelas?.length || 0;
                    const hasEnoughPlacedBets = placedBetsCount >= 3;
                    if (!hasEnoughPlacedBets) {
                        socket.emit('game_start_error', {
                            message: `Cannot start game: At least 3 tickets must have placed bets (currently ${placedBetsCount})`,
                            sessionId
                        });
                        return;
                    }
                    // Update game status to active
                    await this.gameService.updateGameStatus(sessionId, 'active', data.gameData);
                    // Performance optimization: Use batched update for connection status
                    this.scheduleDbUpdate(sessionId, { 'connectionStatus.displayConnected': displayConnected });
                    // Re-emit connection status to ensure UI is updated
                    socket.emit('display:connection_status', {
                        connected: displayConnected,
                        sessionId
                    });
                    // CRITICAL FIX: Emit game status update to display immediately
                    const displayRoom = `display:${sessionId}`;
                    const consistentGameId = this.getConsistentGameId(game);
                    this.io.to(displayRoom).emit('game_status_updated', {
                        gameId: consistentGameId,
                        status: 'active',
                        gameData: data.gameData || {},
                        timestamp: new Date()
                    });
                    // Also emit game data updated to display
                    this.io.to(displayRoom).emit('game_data_updated', {
                        id: consistentGameId,
                        status: 'active',
                        gameData: data.gameData || {},
                        timestamp: new Date()
                    });
                    // CRITICAL FIX: Emit the correct event name that the display is listening for
                    this.io.to(displayRoom).emit('game_start', {
                        gameId: consistentGameId,
                        status: 'active',
                        gameData: data.gameData || {},
                        timestamp: new Date()
                    });
                    // CRITICAL: Emit game_start event to cashier for proper sync (same as display)
                    if (cashierId) {
                        this.io.to(`cashier:${cashierId}`).emit('game_start', {
                            gameId: consistentGameId,
                            status: 'active',
                            gameData: data.gameData || {},
                            timestamp: new Date()
                        });
                    }
                    // Also broadcast to all clients
                    await this.gameService.emitConnectionStatusUpdate(sessionId);
                    // Clear cache after game status change
                    this.gameCache.delete(sessionId);
                }
                catch (error) {
                    console.error(`Error starting game for session ${sessionId}:`, error);
                }
            }
        });
        socket.on('pause_game', async (data) => {
            if (sessionId) {
                await this.gameService.updateGameStatus(sessionId, 'paused', data.gameData);
                this.gameCache.delete(sessionId);
            }
        });
        socket.on('resume_game', async (data) => {
            if (sessionId) {
                await this.gameService.updateGameStatus(sessionId, 'active', data.gameData);
                this.gameCache.delete(sessionId);
            }
        });
        socket.on('end_game', async (data) => {
            if (sessionId) {
                console.log(`🎮 Ending game for session: ${sessionId}`);
                console.log(`🎮 Starting complete game cleanup process...`);
                // Get the current cashier ID for this session
                let cashierIdForNewGame = null;
                try {
                    const currentGame = await this.getGameData(sessionId);
                    if (currentGame) {
                        cashierIdForNewGame = currentGame.cashierId;
                        console.log(`🎮 Current cashier ID: ${cashierIdForNewGame}`);
                    }
                }
                catch (error) {
                    console.error('Error getting current game info:', error);
                }
                // Archive the completed game
                try {
                    const currentGame = await this.getGameData(sessionId);
                    if (currentGame && currentGame.gameData) {
                        try {
                            // Get the latest aggregated financial data before archiving
                            let aggregatedGameData = currentGame.gameData;
                            try {
                                const { GameAggregationService } = await Promise.resolve().then(() => __importStar(require('../services/gameAggregationService')));
                                const latestGameData = await GameAggregationService.getRealTimeGameData(sessionId, currentGame.gameId);
                                if (latestGameData && latestGameData.gameData) {
                                    aggregatedGameData = latestGameData.gameData;
                                }
                            }
                            catch (aggregationError) {
                                console.error('Error getting latest aggregated data for archiving:', aggregationError);
                            }
                            // Archive the complete game data using the new service
                            try {
                                const { GameAggregationService } = await Promise.resolve().then(() => __importStar(require('../services/gameAggregationService')));
                                await GameAggregationService.moveGameToCompleted(sessionId, currentGame.gameId);
                            }
                            catch (archiveError) {
                                console.error('❌ Error archiving game with GameAggregationService:', archiveError);
                                // Fallback to old method if the new service fails
                                try {
                                    // Archive the complete game data
                                    const gameToArchive = {
                                        gameId: currentGame.gameId,
                                        cashierId: currentGame.cashierId,
                                        sessionId: currentGame.sessionId,
                                        status: 'completed',
                                        gameData: {
                                            ...aggregatedGameData,
                                            gameEndTime: new Date(),
                                            finalProgress: aggregatedGameData.progress || 0,
                                            finalCalledNumbers: aggregatedGameData.calledNumbers || [],
                                            finalCurrentNumber: aggregatedGameData.currentNumber || null,
                                            finalCartelas: aggregatedGameData.cartelas || 0,
                                            finalTotalStack: aggregatedGameData.totalStack || 0,
                                            finalTotalWinStack: aggregatedGameData.totalWinStack || 0,
                                            finalTotalShopMargin: aggregatedGameData.totalShopMargin || 0,
                                            finalTotalSystemFee: aggregatedGameData.totalSystemFee || 0,
                                            finalNetPrizePool: aggregatedGameData.netPrizePool || 0,
                                            finalPlacedBetCartelas: aggregatedGameData.placedBetCartelas || [],
                                            finalDrawHistory: aggregatedGameData.drawHistory || [],
                                            finalSelectedCartelas: aggregatedGameData.selectedCartelas || [],
                                            finalWinPatterns: aggregatedGameData.winPatterns || [],
                                            completedAt: new Date()
                                        },
                                        connectionStatus: currentGame.connectionStatus,
                                        createdAt: currentGame.createdAt,
                                        completedAt: new Date()
                                    };
                                    const CompletedGame = (await Promise.resolve().then(() => __importStar(require('../models/CompletedGame')))).default;
                                    await CompletedGame.create(gameToArchive);
                                }
                                catch (fallbackError) {
                                    console.error('❌ Fallback archiving also failed:', fallbackError);
                                }
                            }
                        }
                        catch (error) {
                            console.error('Error archiving game:', error);
                        }
                    }
                }
                catch (error) {
                    console.error('❌ Error archiving game via socket:', error);
                }
                // Remove the old game
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    await Game.findOneAndDelete({ sessionId });
                }
                catch (error) {
                    console.error('❌ Error removing old game from games collection:', error);
                }
                // Clear cartela selections from memory
                this.selectedCartelas.delete(sessionId);
                this.lastEmittedSelections.delete(sessionId);
                // Calculate next game ID - FIXED LOGIC
                let newGameId = '4000';
                try {
                    // Get the current game that's about to be deleted
                    const currentGame = await this.getGameData(sessionId);
                    if (currentGame && currentGame.gameId) {
                        const currentGameIdNumber = parseInt(currentGame.gameId.toString(), 10) || 4000;
                        let nextGameId = currentGameIdNumber + 1;
                        // Ensure we don't exceed maximum (4999) and reset to 4000
                        if (nextGameId > 4999) {
                            nextGameId = 4000;
                        }
                        newGameId = nextGameId.toString();
                    }
                    else {
                    }
                }
                catch (error) {
                    console.error('❌ Error calculating next game ID:', error);
                }
                // Create new game with clean state - PRESERVE CONNECTION STATUS
                let newGame = null;
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    // Get the current game to preserve connection status
                    const currentGame = await this.getGameData(sessionId);
                    const displayConnected = currentGame?.connectionStatus?.displayConnected || false;
                    const cashierConnected = currentGame?.connectionStatus?.cashierConnected || false;
                    const newGameData = {
                        gameId: newGameId,
                        cashierId: cashierIdForNewGame,
                        sessionId: sessionId,
                        displayToken: sessionId,
                        status: 'waiting',
                        isConnected: true,
                        connectedAt: new Date(),
                        lastActivity: new Date(),
                        gameData: {
                            cartelas: 0,
                            totalStack: 0,
                            totalWinStack: 0,
                            totalShopMargin: 0,
                            totalSystemFee: 0,
                            netPrizePool: 0,
                            placedBetCartelas: [],
                            selectedCartelas: [],
                            progress: 0,
                            calledNumbers: [],
                            currentNumber: null,
                            drawHistory: [],
                            gameStartTime: null,
                            gameEndTime: null,
                            lastDrawTime: null,
                            winPatterns: []
                        },
                        connectionStatus: {
                            displayConnected: displayConnected, // PRESERVE actual display connection status
                            cashierConnected: cashierConnected, // PRESERVE actual cashier connection status
                            lastDisplayActivity: currentGame?.connectionStatus?.lastDisplayActivity || new Date(),
                            lastCashierActivity: new Date()
                        }
                    };
                    newGame = await Game.create(newGameData);
                }
                catch (error) {
                    console.error('❌ Error creating new game:', error);
                }
                // Emit game ended event to display and game rooms
                this.io.to(`display:${sessionId}`).emit('game_ended', {
                    gameId: newGameId,
                    status: 'waiting',
                    timestamp: new Date()
                });
                this.io.to(`game:${sessionId}`).emit('game_ended', {
                    gameId: newGameId,
                    status: 'waiting',
                    timestamp: new Date()
                });
                // CRITICAL: Emit game ended event to cashier for proper sync (same as display)
                if (cashierIdForNewGame) {
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('game_ended', {
                        gameId: newGameId,
                        status: 'waiting',
                        timestamp: new Date()
                    });
                }
                // Emit comprehensive reset event to display
                this.io.to(`display:${sessionId}`).emit('game_comprehensive_reset', {
                    newGameId: newGameId,
                    message: 'Game ended - new game ready',
                    timestamp: new Date()
                });
                // CRITICAL: Emit comprehensive reset event to cashier for proper sync (same as display)
                if (cashierIdForNewGame) {
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('game_comprehensive_reset', {
                        newGameId: newGameId,
                        message: 'Game ended - new game ready',
                        timestamp: new Date()
                    });
                }
                // Emit placed bets updated event with empty array for new game
                this.io.to(`display:${sessionId}`).emit('placed_bets_updated', {
                    placedBetCartelas: [],
                    gameId: newGameId,
                    timestamp: new Date()
                });
                // CRITICAL: Emit placed bets updated event to cashier for proper sync (same as display)
                if (cashierIdForNewGame) {
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('placed_bets_updated', {
                        placedBetCartelas: [],
                        gameId: newGameId,
                        timestamp: new Date()
                    });
                }
                // Emit close cartelas event to prepare display for new game
                this.io.to(`display:${sessionId}`).emit('close_cartelas', {
                    timestamp: new Date()
                });
                this.io.to(`game:${sessionId}`).emit('close_cartelas', {
                    timestamp: new Date()
                });
                // CRITICAL: Emit close cartelas event to cashier for proper sync (same as display)
                if (cashierIdForNewGame) {
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('close_cartelas', {
                        timestamp: new Date()
                    });
                }
                // CRITICAL: Emit connection status update after new game creation
                if (newGame && cashierIdForNewGame) {
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('display:connection_status', {
                        connected: newGame.connectionStatus.displayConnected,
                        sessionId: sessionId
                    });
                    // Also emit comprehensive status update
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('connection:status_update', {
                        display: {
                            connected: newGame.connectionStatus.displayConnected,
                            sessionId: sessionId,
                            timestamp: new Date()
                        },
                        cashier: {
                            connected: newGame.connectionStatus.cashierConnected,
                            sessionId: sessionId,
                            timestamp: new Date()
                        },
                        game: {
                            gameId: newGameId,
                            status: 'waiting',
                            timestamp: new Date()
                        }
                    });
                    // Also emit game session info to cashier
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('game_session_info', {
                        gameId: newGameId,
                        sessionId: sessionId,
                        status: 'waiting'
                    });
                    // CRITICAL: Emit game_data_updated to cashier for proper sync (same as display)
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('game_data_updated', {
                        id: newGameId,
                        status: 'waiting',
                        gameData: newGame.gameData,
                        sessionId: sessionId,
                        timestamp: new Date()
                    });
                    // CRITICAL: Emit game_status_updated to cashier for proper sync (same as display)
                    this.io.to(`cashier:${cashierIdForNewGame}`).emit('game_status_updated', {
                        gameId: newGameId,
                        status: 'waiting',
                        sessionId: sessionId,
                        timestamp: new Date()
                    });
                }
            }
        });
        socket.on('reset_game', async (data) => {
            if (sessionId) {
                await this.gameService.resetGame(sessionId);
                // Get current game ID from database to preserve it during reset
                let currentGameId = '0';
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const game = await Game.findOne({ sessionId });
                    if (game && game.gameId) {
                        currentGameId = game.gameId.toString();
                    }
                }
                catch (error) {
                    console.error('Error getting current game ID for reset:', error);
                }
                // Clear game state on cashier side - emit events that the component listens for
                socket.emit('game_reset', {
                    gameId: currentGameId, // Keep current game ID, don't set to null
                    status: 'waiting',
                    calledNumbers: [],
                    currentNumber: null,
                    progress: 0,
                    cartelas: 0,
                    totalStack: 0,
                    totalWinStack: 0,
                    timestamp: new Date()
                });
                // Clear game state on display side
                this.io.to(`display:${sessionId}`).emit('game_reset', {
                    gameId: currentGameId, // Keep current game ID, don't set to null
                    status: 'waiting',
                    progress: '0/75',
                    cartelas: 0,
                    winStack: 'Br. 0',
                    message: 'Game reset'
                });
                // Also emit to the game room if it exists
                this.io.to(`game:${sessionId}`).emit('game_reset', {
                    gameId: currentGameId, // Keep current game ID, don't set to null
                    status: 'waiting',
                    progress: '0/75',
                    cartelas: 0,
                    message: 'Game reset'
                });
            }
        });
        socket.on('get_game_data', async (data) => {
            if (sessionId) {
                const gameData = await this.gameService.getGameData(sessionId);
                socket.emit('game_data_response', gameData);
            }
        });
        socket.on('get_display_status', async (data) => {
            if (sessionId) {
                const game = await this.getGameData(sessionId);
                if (game) {
                    const isDisplayConnected = game.connectionStatus?.displayConnected || false;
                    socket.emit('display_status_response', { connected: isDisplayConnected });
                }
            }
        });
        // REAL-TIME SYNC: Manual sync event for cashier
        socket.on('sync_now', async (data) => {
            if (sessionId) {
                try {
                    const game = await this.getGameData(sessionId, true); // Force refresh
                    if (game) {
                        // Emit immediate sync to cashier
                        socket.emit('game_data_sync', {
                            gameId: game.gameId,
                            status: game.status,
                            gameData: game.gameData,
                            sessionId: sessionId,
                            timestamp: new Date()
                        });
                        // Also emit game session info
                        socket.emit('game_session_info', {
                            gameId: game.gameId,
                            sessionId: sessionId,
                            status: game.status
                        });
                    }
                }
                catch (error) {
                    console.error('Error in manual sync:', error);
                }
            }
        });
        // Handle cartela display on display
        socket.on('show_cartelas_on_display', async (data) => {
            if (sessionId) {
                // Check if game status allows cartela display
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const game = await Game.findOne({ sessionId });
                    if (game && game.status !== 'waiting') {
                        socket.emit('cartela_display_error', {
                            message: `Cannot show cartelas while game is ${game.status}. Only allowed during 'waiting' status.`,
                            gameStatus: game.status
                        });
                        console.log(`❌ Cartela display blocked - game status is ${game.status}, not 'waiting'`);
                        return;
                    }
                }
                catch (error) {
                    console.error('Error checking game status for cartela display:', error);
                }
                // Clear any previous cartela selections for this session
                if (this.selectedCartelas.has(sessionId)) {
                    this.selectedCartelas.delete(sessionId);
                }
                // Clear last emitted selections
                if (this.lastEmittedSelections.has(sessionId)) {
                    this.lastEmittedSelections.delete(sessionId);
                }
                // Clear from database - only clear selected cartelas, preserve placed bet cartelas
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    await Game.findOneAndUpdate({ sessionId }, {
                        $set: {
                            'gameData.selectedCartelas': []
                            // Don't clear placedBetCartelas - they should remain for the game
                        },
                        lastActivity: new Date()
                    });
                }
                catch (error) {
                    console.error('Error clearing cartela selections from database:', error);
                }
                // Emit to display room
                this.io.to(`display:${sessionId}`).emit('show_cartelas', {
                    cartelas: data.cartelas,
                    cashierId: cashierId,
                    timestamp: new Date()
                });
                // Also emit to the game room if it exists
                this.io.to(`game:${sessionId}`).emit('show_cartelas', {
                    cartelas: data.cartelas,
                    cashierId: cashierId, // Include cashier ID for game room
                    timestamp: new Date()
                });
            }
            else {
                console.error('❌ No sessionId in show_cartelas_on_display handler');
            }
        });
        // Handle request for current cartela selections
        socket.on('get_cartela_selections', async (data) => {
            if (sessionId) {
                try {
                    // Get selections from memory (current session)
                    let selections = this.selectedCartelas.get(sessionId) || new Set();
                    // If no selections in memory, try to restore from database
                    if (selections.size === 0) {
                        const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                        const game = await Game.findOne({ sessionId });
                        if (game && game.gameData && game.gameData.selectedCartelas) {
                            // Ensure type safety for selectedCartelas
                            const selectedCartelas = game.gameData.selectedCartelas;
                            selections = new Set(selectedCartelas);
                            // Update memory cache
                            this.selectedCartelas.set(sessionId, selections);
                        }
                    }
                    // Only log if there are actual selections to avoid spam
                    if (selections.size > 0) {
                    }
                    else {
                    }
                    socket.emit('cartela_selections_response', {
                        selectedCartelas: Array.from(selections),
                        timestamp: new Date()
                    });
                }
                catch (error) {
                    console.error('Error getting cartela selections:', error);
                    // Fallback to memory cache
                    const selections = this.selectedCartelas.get(sessionId) || new Set();
                    socket.emit('cartela_selections_response', {
                        selectedCartelas: Array.from(selections),
                        timestamp: new Date()
                    });
                }
            }
        });
        // Handle cartela selection by players - OPTIMIZED for performance
        socket.on('select_cartela', async (data) => {
            if (data.sessionId) {
                // Performance optimization: Use cached game data
                const game = await this.getGameData(data.sessionId);
                if (game && game.status !== 'waiting') {
                    socket.emit('cartela_selection_error', {
                        message: `Cannot select cartelas while game is ${game.status}. Only allowed during 'waiting' status.`,
                        cartelaId: data.cartelaId,
                        gameStatus: game.status
                    });
                    console.log(`❌ Cartela selection blocked - game status is ${game.status}, not 'waiting'`);
                    return;
                }
                if (!game) {
                    console.log(`❌ SERVER: No game found for sessionId: ${data.sessionId}`);
                    socket.emit('cartela_selection_error', {
                        message: 'Game not found for this session',
                        cartelaId: data.cartelaId
                    });
                    return;
                }
                // Add to selected cartelas for this session
                if (!this.selectedCartelas.has(data.sessionId)) {
                    this.selectedCartelas.set(data.sessionId, new Set());
                }
                this.selectedCartelas.get(data.sessionId).add(data.cartelaId);
                // Always emit events immediately for real-time updates
                const currentSelections = this.selectedCartelas.get(data.sessionId);
                // Performance optimization: Use batched database update
                this.scheduleDbUpdate(data.sessionId, {
                    $addToSet: { 'gameData.selectedCartelas': data.cartelaId }
                });
                // Notify display about the selection IMMEDIATELY
                this.io.to(`display:${data.sessionId}`).emit('cartela_selected', {
                    cartelaId: data.cartelaId,
                    timestamp: new Date()
                });
                // Notify game room
                this.io.to(`game:${data.sessionId}`).emit('cartela_selected', {
                    cartelaId: data.cartelaId,
                    timestamp: new Date()
                });
                // Also notify cashier about successful selection
                socket.emit('cartela_selection_success', {
                    cartelaId: data.cartelaId,
                    selectedCartelas: Array.from(currentSelections)
                });
                // CRITICAL: Also emit cartela_selected to the cashier socket for real-time UI updates
                socket.emit('cartela_selected', {
                    cartelaId: data.cartelaId,
                    timestamp: new Date()
                });
                // Update last emitted selections
                this.updateLastEmittedSelections(data.sessionId, currentSelections);
            }
            else {
                socket.emit('cartela_selection_error', {
                    message: 'No session ID provided',
                    cartelaId: data.cartelaId
                });
            }
        });
        // Handle cartela deselection - OPTIMIZED for performance
        socket.on('deselect_cartela', async (data) => {
            if (data.sessionId) {
                // Performance optimization: Use cached game data
                const game = await this.getGameData(data.sessionId);
                if (game && game.status !== 'waiting') {
                    socket.emit('cartela_deselection_error', {
                        message: `Cannot deselect cartelas while game is ${game.status}. Only allowed during 'waiting' status.`,
                        cartelaId: data.cartelaId,
                        gameStatus: game.status
                    });
                    console.log(`❌ Cartela deselection blocked - game status is ${game.status}, not 'waiting'`);
                    return;
                }
                if (!game) {
                    console.log(`❌ SERVER: No game found for sessionId: ${data.sessionId}`);
                    socket.emit('cartela_deselection_error', {
                        message: 'Game not found for this session',
                        cartelaId: data.cartelaId
                    });
                    return;
                }
                // Remove from selected cartelas for this session
                if (this.selectedCartelas.has(data.sessionId)) {
                    this.selectedCartelas.get(data.sessionId).delete(data.cartelaId);
                }
                // Performance optimization: Use batched database update
                this.scheduleDbUpdate(data.sessionId, {
                    $pull: { 'gameData.selectedCartelas': data.cartelaId }
                });
                // Get current selections for success event
                const currentSelections = this.selectedCartelas.get(data.sessionId) || new Set();
                // Notify display about the deselection
                this.io.to(`display:${data.sessionId}`).emit('cartela_deselected', {
                    cartelaId: data.cartelaId,
                    timestamp: new Date()
                });
                // Notify game room
                this.io.to(`game:${data.sessionId}`).emit('cartela_deselected', {
                    cartelaId: data.cartelaId,
                    timestamp: new Date()
                });
                // CRITICAL: Also emit cartela_deselected to the cashier socket for real-time UI updates
                socket.emit('cartela_deselected', {
                    cartelaId: data.cartelaId,
                    timestamp: new Date()
                });
                // Also notify cashier about successful deselection
                socket.emit('cartela_deselection_success', {
                    cartelaId: data.cartelaId,
                    selectedCartelas: Array.from(currentSelections)
                });
                // Update last emitted selections
                this.updateLastEmittedSelections(data.sessionId, currentSelections);
            }
            else {
                socket.emit('cartela_deselection_error', {
                    message: 'No session ID provided',
                    cartelaId: data.cartelaId
                });
            }
        });
        // Handle bet placement - NEW EVENT that connects cartela selection to betting
        socket.on('place_bet', async (data) => {
            if (sessionId) {
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const Bet = (await Promise.resolve().then(() => __importStar(require('../models/Bet')))).default;
                    const Shop = (await Promise.resolve().then(() => __importStar(require('../models/Shop')))).default;
                    const Cashier = (await Promise.resolve().then(() => __importStar(require('../models/Cashier')))).default;
                    // Get current game
                    const game = await Game.findOne({ sessionId });
                    if (!game) {
                        socket.emit('bet_error', { message: 'Game not found' });
                        return;
                    }
                    // Check if game is in waiting status
                    if (game.status !== 'waiting') {
                        socket.emit('bet_error', { message: 'Bets can only be placed when game is waiting' });
                        return;
                    }
                    // Get cashier and shop info for rates
                    const cashier = await Cashier.findById(data.cashierId).populate('shop');
                    if (!cashier) {
                        socket.emit('bet_error', { message: 'Cashier not found' });
                        return;
                    }
                    const shop = await Shop.findById(cashier.shop);
                    if (!shop) {
                        socket.emit('bet_error', { message: 'Shop not found' });
                        return;
                    }
                    // Ensure shop has required fields
                    const shopMargin = shop.margin;
                    if (typeof shopMargin !== 'number') {
                        socket.emit('bet_error', { message: 'Shop configuration is incomplete. Please contact admin.' });
                        return;
                    }
                    // Calculate financial fields - ONLY use exact shop values
                    const totalStake = data.stake * data.cartelaIds.length;
                    const shopMarginAmount = (totalStake * shopMargin) / 100; // Full shop margin amount
                    const winnerPrizePool = totalStake - shopMarginAmount; // Winner gets total - shop margin
                    const shopProfit = shopMarginAmount; // Shop gets full margin
                    // Create bets for each cartela
                    const bets = [];
                    for (const cartelaId of data.cartelaIds) {
                        // Generate ticket number
                        const lastBet = await Bet.findOne().sort({ ticketNumber: -1 });
                        const nextNumber = lastBet ? parseInt(lastBet.ticketNumber) + 1 : 1;
                        const ticketNumber = nextNumber.toString().padStart(13, '0');
                        // Generate bet ID
                        const betId = `BET_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                        const bet = new Bet({
                            ticketNumber,
                            betId: `BET_${Date.now()}_${cartelaId}`,
                            gameId: game.gameId,
                            sessionId,
                            cashierId: data.cashierId,
                            cartelaId,
                            stake: data.stake,
                            betType: 'single',
                            betStatus: 'pending',
                            gameProgress: game.gameData?.progress || 0,
                            selectedNumbers: [], // Will be populated when game starts
                            win: 0, // Initial win amount is 0
                            isVerified: false
                        });
                        await bet.save();
                        bets.push(bet);
                    }
                    // Use aggregation service to update game with real-time bet totals
                    const { GameAggregationService } = await Promise.resolve().then(() => __importStar(require('../services/gameAggregationService')));
                    const updatedGame = await GameAggregationService.updateGameWithAggregatedData(sessionId, game.gameId);
                    if (!updatedGame) {
                        socket.emit('bet_error', { message: 'Failed to update game data' });
                        return;
                    }
                    // Remove selected cartelas from selection (they now have bets)
                    if (this.selectedCartelas.has(sessionId)) {
                        data.cartelaIds.forEach(id => {
                            this.selectedCartelas.get(sessionId).delete(id);
                        });
                    }
                    // Calculate and update totalWinStack based on current game progress
                    try {
                        const currentGame = await Game.findOne({ sessionId });
                        if (currentGame && currentGame.gameData) {
                            const totalWinStack = this.calculateTotalWinStack(currentGame.gameData);
                            if (totalWinStack !== currentGame.gameData.totalWinStack) {
                                await Game.findOneAndUpdate({ sessionId }, { 'gameData.totalWinStack': totalWinStack }, { new: true });
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error calculating totalWinStack:', error);
                    }
                    // CRITICAL FIX: Use the ACTUAL game ID from the current game session
                    // This ensures we always get the correct, current game ID
                    let gameIdToEmit = updatedGame.gameId;
                    // Double-check: Get the current active game from database to ensure accuracy
                    try {
                        const currentActiveGame = await Game.findOne({
                            sessionId,
                            isConnected: true
                        }).sort({ lastActivity: -1 });
                        if (currentActiveGame && currentActiveGame.gameId) {
                            gameIdToEmit = currentActiveGame.gameId;
                            console.log(`🎮 Using ACTUAL current game ID from database: ${gameIdToEmit}`);
                        }
                        else {
                            console.log(`⚠️ No active game found, using updatedGame.gameId: ${gameIdToEmit}`);
                        }
                    }
                    catch (error) {
                        console.error('Error getting current active game from database:', error);
                        // Fallback to updatedGame.gameId
                        gameIdToEmit = updatedGame.gameId || 'N/A';
                    }
                    // Emit success events AFTER gameId calculation
                    socket.emit('bet_placed_success', {
                        cartelaIds: data.cartelaIds,
                        totalStake,
                        ticketNumbers: bets.map(b => b.ticketNumber),
                        gameData: updatedGame.gameData,
                        gameId: gameIdToEmit // Use the calculated game ID
                    });
                    // 🖨️ TICKET PRINTING: Print tickets for all placed bets
                    try {
                        console.log('🖨️ Starting ticket printing process...');
                        console.log('🖨️ DEBUG: Number of bets to print:', bets.length);
                        console.log('🖨️ DEBUG: Bet details:', bets.map(b => ({ ticketNumber: b.ticketNumber, cartelaId: b.cartelaId })));
                        // Prepare ticket data for each bet
                        const ticketsToPrint = [];
                        for (const bet of bets) {
                            // Get cartela numbers from database
                            const { Cartela } = await Promise.resolve().then(() => __importStar(require('../models/Cartela')));
                            const cartela = await Cartela.findOne({
                                cartelaId: bet.cartelaId,
                                cashierId: data.cashierId,
                                isActive: true
                            });
                            // Convert 2D pattern to 1D array for printing
                            let cartelaNumbers = [];
                            if (cartela && cartela.pattern) {
                                cartelaNumbers = cartela.pattern.flat(); // Flatten 2D array to 1D
                            }
                            else {
                                // Fallback to default numbers if cartela not found
                                cartelaNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
                            }
                            ticketsToPrint.push({
                                ticketNumber: bet.ticketNumber,
                                cashierFirstName: cashier.fullName || 'Unknown',
                                cashierUsername: cashier.username || 'unknown',
                                gameId: gameIdToEmit,
                                cartelaId: bet.cartelaId,
                                stake: bet.stake,
                                cartelaNumbers: cartelaNumbers,
                                dateTime: new Date()
                            });
                        }
                        // Print all tickets directly without connection check
                        console.log('🖨️ DEBUG: Attempting to print', ticketsToPrint.length, 'tickets...');
                        const printResults = await printerService_1.printerService.printMultipleBingoTickets(ticketsToPrint);
                        // Log print results
                        const successfulPrints = printResults.filter(result => result.success).length;
                        const failedPrints = printResults.filter(result => !result.success).length;
                        console.log(`🖨️ Ticket printing completed: ${successfulPrints} successful, ${failedPrints} failed`);
                        // Log any failed prints
                        if (failedPrints > 0) {
                            printResults.forEach((result, index) => {
                                if (!result.success) {
                                    console.error(`❌ Failed to print ticket ${ticketsToPrint[index].ticketNumber}:`, result.error);
                                }
                            });
                        }
                        // Emit print status to cashier (optional - for UI feedback)
                        socket.emit('ticket_print_status', {
                            totalTickets: ticketsToPrint.length,
                            successfulPrints,
                            failedPrints,
                            ticketNumbers: ticketsToPrint.map(t => t.ticketNumber)
                        });
                    }
                    catch (printError) {
                        console.error('❌ Error during ticket printing:', printError);
                        // Don't fail the bet placement if printing fails
                    }
                    // Notify display about new bets
                    this.io.to(`display:${sessionId}`).emit('bets_placed', {
                        cartelaIds: data.cartelaIds,
                        totalStake,
                        gameData: updatedGame.gameData
                    });
                    // Notify game room
                    this.io.to(`game:${sessionId}`).emit('bets_placed', {
                        cartelaIds: data.cartelaIds,
                        totalStake,
                        gameData: updatedGame.gameData
                    });
                    // Emit real-time update to display immediately after bet placement
                    this.io.to(`display:${sessionId}`).emit('game_data_updated', {
                        id: gameIdToEmit,
                        status: updatedGame.status,
                        gameData: updatedGame.gameData,
                        sessionId: sessionId
                    });
                    // Also emit to cashier for real-time updates
                    this.io.to(`cashier:${data.cashierId}`).emit('game_data_updated', {
                        id: gameIdToEmit,
                        status: updatedGame.status,
                        gameData: updatedGame.gameData,
                        sessionId: sessionId
                    });
                    // Also emit placed bets updated
                    if (updatedGame.gameData) {
                        this.io.to(`display:${sessionId}`).emit('placed_bets_updated', {
                            placedBetCartelas: updatedGame.gameData.placedBetCartelas || [],
                            gameId: updatedGame._id,
                            timestamp: new Date()
                        });
                    }
                    // Normal data aggregation when bet is placed
                    try {
                        const GameAggregationService = (await Promise.resolve().then(() => __importStar(require('../services/gameAggregationService')))).default;
                        await GameAggregationService.updateGameWithAggregatedData(sessionId, updatedGame.gameId);
                        // Emit normal data update to display
                        this.io.to(`display:${sessionId}`).emit('game_data_updated', {
                            id: gameIdToEmit,
                            status: updatedGame.status,
                            gameData: updatedGame.gameData,
                            sessionId: sessionId
                        });
                    }
                    catch (error) {
                        console.error(`Error in normal aggregation on bet placement:`, error);
                    }
                }
                catch (error) {
                    console.error('Error placing bet:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    socket.emit('bet_error', { message: 'Failed to place bet: ' + errorMessage });
                }
            }
        });
        // Handle clearing all cartelas (new event for Clear button)
        socket.on('clear_all_cartelas', async (data) => {
            if (sessionId) {
                // Clear from local memory
                if (this.selectedCartelas.has(sessionId)) {
                    this.selectedCartelas.get(sessionId).clear();
                }
                // Clear from database - only clear selected cartelas, keep placed bet cartelas
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    await Game.findOneAndUpdate({ sessionId }, {
                        $set: {
                            'gameData.selectedCartelas': []
                            // Don't clear placedBetCartelas - they should remain visible on display
                        },
                        lastActivity: new Date()
                    });
                }
                catch (error) {
                    console.error('Error clearing cartela selections from database:', error);
                }
                // Emit clear event to display room
                this.io.to(`display:${sessionId}`).emit('cartelas_cleared', {
                    sessionId,
                    timestamp: new Date()
                });
                // Emit clear event to game room
                this.io.to(`game:${sessionId}`).emit('cartelas_cleared', {
                    sessionId,
                    timestamp: new Date()
                });
                // Emit placed bets updated event to refresh display data - keep existing placed bets
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const game = await Game.findOne({ sessionId });
                    const currentPlacedBets = game?.gameData?.placedBetCartelas || [];
                    this.io.to(`display:${sessionId}`).emit('placed_bets_updated', {
                        placedBetCartelas: currentPlacedBets, // Keep existing placed bet cartelas
                        gameId: game?._id,
                        timestamp: new Date()
                    });
                }
                catch (error) {
                    console.error('Error getting current placed bet cartelas:', error);
                    // Fallback to empty array if error
                    this.io.to(`display:${sessionId}`).emit('placed_bets_updated', {
                        placedBetCartelas: [],
                        gameId: undefined,
                        timestamp: new Date()
                    });
                }
            }
        });
        // Handle closing cartela display
        socket.on('close_cartela_display', async (data) => {
            if (sessionId) {
                // Clear cartela selections when display is closed
                if (this.selectedCartelas.has(sessionId)) {
                    this.selectedCartelas.delete(sessionId);
                }
                // Clear last emitted selections
                if (this.lastEmittedSelections.has(sessionId)) {
                    this.lastEmittedSelections.delete(sessionId);
                }
                // Clear from database - only clear selected cartelas, preserve placed bet cartelas
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    await Game.findOneAndUpdate({ sessionId }, {
                        $set: {
                            'gameData.selectedCartelas': []
                            // Don't clear placedBetCartelas - they should remain for the game
                        },
                        lastActivity: new Date()
                    });
                }
                catch (error) {
                    console.error('Error clearing cartela selections from database:', error);
                }
                this.io.to(`display:${sessionId}`).emit('close_cartelas', {
                    timestamp: new Date()
                });
                this.io.to(`game:${sessionId}`).emit('close_cartelas', {
                    timestamp: new Date()
                });
                // Emit placed bets updated event to refresh display data with preserved placed bets
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const game = await Game.findOne({ sessionId });
                    const currentPlacedBets = game?.gameData?.placedBetCartelas || [];
                    this.io.to(`display:${sessionId}`).emit('placed_bets_updated', {
                        placedBetCartelas: currentPlacedBets, // Keep existing placed bet cartelas
                        gameId: game?._id,
                        timestamp: new Date()
                    });
                }
                catch (error) {
                    console.error('Error getting current placed bet cartelas:', error);
                    // Fallback to empty array if error
                    this.io.to(`display:${sessionId}`).emit('placed_bets_updated', {
                        placedBetCartelas: [],
                        gameId: undefined,
                        timestamp: new Date()
                    });
                }
            }
        });
        // Handle game start - DON'T clear cartela selections from database, only close display
        socket.on('start_game', async (data) => {
            if (sessionId) {
                // Clear cartela selections from memory only (not database)
                if (this.selectedCartelas.has(sessionId)) {
                    this.selectedCartelas.delete(sessionId);
                }
                // Clear last emitted selections from memory only
                if (this.lastEmittedSelections.has(sessionId)) {
                    this.lastEmittedSelections.delete(sessionId);
                }
                // Emit event to close cartela display only (don't clear database)
                this.io.to(`display:${sessionId}`).emit('close_cartelas', {
                    timestamp: new Date()
                });
                this.io.to(`game:${sessionId}`).emit('close_cartelas', {
                    timestamp: new Date()
                });
                // IMPORTANT: Emit current betting data to display so it shows the preserved values
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const currentGame = await Game.findOne({ sessionId });
                    if (currentGame && currentGame.gameData) {
                        // Emit game data update with preserved betting information
                        this.io.to(`display:${sessionId}`).emit('game_data_updated', {
                            id: currentGame.gameId,
                            status: currentGame.status,
                            gameData: currentGame.gameData,
                            sessionId: sessionId
                        });
                        // Also emit to cashier for real-time updates
                        this.io.to(`cashier:${cashierId}`).emit('game_data_updated', {
                            id: currentGame.gameId,
                            status: currentGame.status,
                            gameData: currentGame.gameData,
                            sessionId: sessionId
                        });
                        // Also emit placed bets updated to refresh the display
                        this.io.to(`display:${sessionId}`).emit('placed_bets_updated', {
                            placedBetCartelas: currentGame.gameData.placedBetCartelas || [],
                            gameId: currentGame._id,
                            timestamp: new Date()
                        });
                        // Normal data aggregation when game starts
                        try {
                            const GameAggregationService = (await Promise.resolve().then(() => __importStar(require('../services/gameAggregationService')))).default;
                            await GameAggregationService.updateGameWithAggregatedData(sessionId, currentGame.gameId);
                            // Emit normal data update to display
                            this.io.to(`display:${sessionId}`).emit('game_data_updated', {
                                id: currentGame.gameId,
                                status: currentGame.status,
                                gameData: currentGame.gameData,
                                sessionId: sessionId
                            });
                        }
                        catch (error) {
                            console.error(`Error in normal aggregation on game start:`, error);
                        }
                    }
                }
                catch (error) {
                    console.error('Error emitting preserved betting data to display:', error);
                }
            }
        });
        // Bet events
        socket.on('create_bet', async (data) => {
            if (sessionId) {
                socket.emit('bet_created', { message: 'Bet creation not implemented yet' });
            }
        });
        socket.on('get_bets', async () => {
            if (sessionId) {
                socket.emit('bets_response', []);
            }
        });
        // Game Launcher events
        socket.on('get_available_sessions', async () => {
            try {
                const activeGames = await Game_1.default.find({
                    'connectionStatus.displayConnected': true,
                    isConnected: true
                }).sort({ lastActivity: -1 });
                const sessions = activeGames.map(game => ({
                    sessionId: game.sessionId,
                    displayToken: game.displayToken,
                    gameId: game.gameId,
                    status: game.status,
                    lastActivity: game.lastActivity,
                    isConnected: game.connectionStatus?.displayConnected || false
                }));
                socket.emit('available_sessions_response', sessions);
            }
            catch (error) {
                socket.emit('available_sessions_response', []);
            }
        });
        socket.on('refresh_sessions', async () => {
            try {
                const activeGames = await Game_1.default.find({
                    'connectionStatus.displayConnected': true,
                    isConnected: true
                }).sort({ lastActivity: -1 });
                const sessions = activeGames.map(game => ({
                    sessionId: game.sessionId,
                    displayToken: game.displayToken,
                    gameId: game.gameId,
                    status: game.status,
                    lastActivity: game.lastActivity,
                    isConnected: game.connectionStatus?.displayConnected || false
                }));
                socket.emit('available_sessions_response', sessions);
            }
            catch (error) {
                socket.emit('available_sessions_response', []);
            }
        });
        // Handle cashier disconnect
        socket.on('disconnect', async () => {
            console.log(`👤 Cashier ${cashierId} disconnecting from session ${sessionId}`);
            await this.handleDisconnect(cashierId, sessionId);
        });
        // Handle get_display_status request
        socket.on('get_display_status', async (data) => {
            if (data.sessionId) {
                try {
                    const game = await this.getGameData(data.sessionId);
                    const displayConnected = game?.connectionStatus?.displayConnected || false;
                    // Emit display connection status to the requesting client
                    socket.emit('display:connection_status', {
                        connected: displayConnected,
                        sessionId: data.sessionId
                    });
                }
                catch (error) {
                    console.error('Error getting display status:', error);
                    socket.emit('display:connection_status', { connected: false, sessionId: data.sessionId });
                }
            }
        });
        // Handle display:connected event
        socket.on('display:connected', async (data) => {
            if (data.token && sessionId) {
                try {
                    // Update the database connection status
                    const game = await Game_1.default.findOne({ sessionId });
                    if (game) {
                        await Game_1.default.findOneAndUpdate({ sessionId }, {
                            'connectionStatus.displayConnected': true,
                            'connectionStatus.lastDisplayActivity': new Date(),
                            lastActivity: new Date()
                        }, { new: true });
                        // Emit updated connection status to cashier
                        socket.emit('display:connection_status', {
                            connected: true,
                            sessionId
                        });
                        // Broadcast the updated connection status to all clients
                        await this.gameService.emitConnectionStatusUpdate(sessionId);
                    }
                }
                catch (error) {
                    console.error('Error handling display:connected event:', error);
                }
            }
        });
        // Handle display:connection_status events from display
        socket.on('display:connection_status', async (data) => {
            if (data.sessionId === sessionId) {
                // Update the database connection status
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    await Game.findOneAndUpdate({ sessionId }, {
                        'connectionStatus.displayConnected': data.connected,
                        'connectionStatus.lastDisplayActivity': new Date(),
                        lastActivity: new Date()
                    }, { new: true });
                    // CRITICAL FIX: Also emit game status update to ensure cashier UI stays in sync
                    socket.emit('game:status_update', {
                        sessionId,
                        timestamp: new Date(),
                        message: 'Display connection status updated'
                    });
                }
                catch (error) {
                    console.error('❌ Error updating display connection status:', error);
                }
            }
        });
        // CRITICAL FIX: Handle game status updates to keep cashier in sync
        socket.on('game:status_update', async (data) => {
            if (data.sessionId === sessionId) {
                // Emit the status update to the cashier
                socket.emit('game:status_sync', {
                    sessionId,
                    status: data.status,
                    gameId: data.gameId,
                    timestamp: new Date()
                });
            }
        });
        // CRITICAL FIX: Handle game status change events from the game service
        socket.on('game_status_changed', async (data) => {
            if (data.sessionId === sessionId) {
                // Emit the status change to the cashier
                socket.emit('game:status_sync', {
                    sessionId,
                    status: data.newStatus,
                    gameData: data.gameData,
                    timestamp: new Date()
                });
                // If the game is now active, refresh the game data
                if (data.newStatus === 'active') {
                    // Emit an event to trigger game data refresh
                    socket.emit('game:refresh_required', {
                        sessionId,
                        reason: 'Game status changed to active',
                        timestamp: new Date()
                    });
                }
            }
        });
    }
    setupConnectionStatusCheck(socket, cashierId, sessionId) {
        const statusCheckInterval = setInterval(async () => {
            try {
                if (!socket.connected) {
                    clearInterval(statusCheckInterval);
                    return;
                }
                // Performance optimization: Use cached game data
                const game = await this.getGameData(sessionId);
                if (game && game.connectionStatus) {
                    const displayConnected = game.connectionStatus.displayConnected || false;
                    const cashierConnected = game.connectionStatus.cashierConnected || false;
                    // Emit current connection status
                    socket.emit('display:connection_status', {
                        connected: displayConnected,
                        sessionId: sessionId,
                        cashierId: cashierId,
                        timestamp: new Date()
                    });
                    // Emit comprehensive status update
                    socket.emit('connection:status_update', {
                        display: {
                            connected: displayConnected,
                            sessionId: sessionId,
                            timestamp: new Date()
                        },
                        cashier: {
                            connected: cashierConnected,
                            sessionId: sessionId,
                            timestamp: new Date()
                        },
                        game: {
                            gameId: game.gameId,
                            status: game.status,
                            timestamp: new Date()
                        }
                    });
                    // Performance optimization: Only check socket rooms every 10 seconds to reduce overhead
                    const now = Date.now();
                    const lastSocketCheck = this.lastSocketCheckTime?.get(sessionId) || 0;
                    if (now - lastSocketCheck > 10000) { // Check every 10 seconds
                        // CRITICAL FIX: Also check if display is actually connected by checking socket rooms
                        const displaySockets = await this.io.in(`display:${sessionId}`).fetchSockets();
                        const actualDisplayConnected = displaySockets.length > 0;
                        // Update last check time
                        if (!this.lastSocketCheckTime)
                            this.lastSocketCheckTime = new Map();
                        this.lastSocketCheckTime.set(sessionId, now);
                        // If there's a mismatch, update the database and notify
                        if (actualDisplayConnected !== displayConnected) {
                            // Performance optimization: Use batched database update
                            this.scheduleDbUpdate(sessionId, {
                                'connectionStatus.displayConnected': actualDisplayConnected,
                                'connectionStatus.lastDisplayActivity': new Date()
                            });
                            // Emit corrected status
                            socket.emit('display:connection_status', {
                                connected: actualDisplayConnected,
                                sessionId: sessionId,
                                cashierId: cashierId,
                                timestamp: new Date()
                            });
                            // Broadcast the corrected connection status
                            await this.gameService.emitConnectionStatusUpdate(sessionId);
                        }
                    }
                }
            }
            catch (error) {
                console.error('⚠️ Error in connection status check:', error);
            }
        }, 10000); // Check every 10 seconds for better performance
        // Clean up interval on disconnect
        socket.on('disconnect', () => {
            clearInterval(statusCheckInterval);
            // Performance optimization: Clear cache and pending updates on disconnect
            this.gameCache.delete(sessionId);
            this.pendingDbUpdates.delete(sessionId);
            this.lastSocketCheckTime.delete(sessionId);
        });
    }
    // Performance optimization: Cleanup method for session cleanup
    cleanupSession(sessionId) {
        this.gameCache.delete(sessionId);
        this.pendingDbUpdates.delete(sessionId);
        this.lastSocketCheckTime.delete(sessionId);
        this.selectedCartelas.delete(sessionId);
        this.lastEmittedSelections.delete(sessionId);
    }
    // CRITICAL FIX: Centralized method to ensure consistent game ID handling
    getConsistentGameId(game, fallbackGameId) {
        // Priority order: game.gameId > fallbackGameId > 'unknown'
        if (game?.gameId) {
            return game.gameId.toString();
        }
        if (fallbackGameId) {
            return fallbackGameId.toString();
        }
        return 'unknown';
    }
    // REAL-TIME SYNC: Set up automatic data sync for cashier
    setupRealTimeSync(socket, sessionId) {
        const syncInterval = setInterval(async () => {
            try {
                if (!socket.connected) {
                    clearInterval(syncInterval);
                    return;
                }
                // Get fresh game data
                const game = await this.getGameData(sessionId, true); // Force refresh
                if (game) {
                    // Emit real-time game data update to cashier
                    socket.emit('game_data_sync', {
                        gameId: game.gameId,
                        status: game.status,
                        gameData: game.gameData,
                        sessionId: sessionId,
                        timestamp: new Date()
                    });
                    // Also emit game session info for consistency
                    socket.emit('game_session_info', {
                        gameId: game.gameId,
                        sessionId: sessionId,
                        status: game.status
                    });
                }
            }
            catch (error) {
                console.error('Error in real-time sync:', error);
            }
        }, 2000); // Sync every 2 seconds for real-time updates
        // Clean up interval on disconnect
        socket.on('disconnect', () => {
            clearInterval(syncInterval);
        });
    }
    async joinGameRoom(socket, sessionId, cashierId) {
        const gameSession = await this.gameService.joinGameRoom(socket, sessionId, sessionId, cashierId);
        if (gameSession) {
            // Update connection status in database
            await this.gameService.updateConnectionStatus(gameSession.sessionId, 'cashier', true);
            // Get the updated game data to ensure we have the correct game ID
            const updatedGameData = await this.gameService.getGameData(gameSession.sessionId);
            // CRITICAL FIX: Always use the session's gameId for consistency
            // The updatedGameData.id might be from a different source and cause sync issues
            const displayGameId = gameSession.gameId;
            // Emit game session info to cashier
            socket.emit('game_session_info', {
                gameId: displayGameId,
                sessionId: gameSession.sessionId,
                status: 'waiting'
            });
            // Notify display that cashier has joined with updated game ID
            socket.to(gameSession.roomName).emit('cashier_joined_room', {
                gameId: displayGameId,
                cashierId,
                sessionId,
                timestamp: new Date()
            });
            // CRITICAL FIX: Ensure game data update uses consistent game ID
            if (updatedGameData) {
                // Override any inconsistent game ID with the session's game ID
                const consistentGameData = {
                    ...updatedGameData,
                    id: displayGameId // Use the consistent game ID
                };
                socket.to(gameSession.roomName).emit('game_data_updated', consistentGameData);
            }
        }
    }
    async handleDisconnect(cashierId, sessionId) {
        try {
            const CashierModel = (await Promise.resolve().then(() => __importStar(require('../models/Cashier')))).default;
            await CashierModel.findByIdAndUpdate(cashierId, {
                isConnected: false,
                lastActivity: new Date()
            });
            // Update game connection status
            if (sessionId) {
                await this.gameService.updateConnectionStatus(sessionId, 'cashier', false);
            }
            // Disconnect game session if both cashier and display are disconnected
            if (sessionId) {
                const game = await Game_1.default.findOne({ sessionId });
                if (game && !game.connectionStatus?.displayConnected) {
                    await this.gameService.disconnectGameSession(sessionId);
                }
            }
            // Emit cashier disconnection status to display
            if (sessionId) {
                this.io.to(`display:${sessionId}`).emit('cashier:connection_status', {
                    connected: false,
                    sessionId
                });
            }
            // Emit connection update to admin
            this.io.to('admin').emit('cashier_connection_update', {
                cashierId,
                isConnected: false
            });
        }
        catch (error) {
            console.error('Error updating cashier disconnect status:', error);
        }
    }
    // Method to clear selected cartelas when game ends
    async clearSelectedCartelas(sessionId) {
        if (this.selectedCartelas.has(sessionId)) {
            this.selectedCartelas.delete(sessionId);
            console.log(`🧹 Cleared selected cartelas from memory for session ${sessionId}`);
        }
        // Clear last emitted selections
        if (this.lastEmittedSelections.has(sessionId)) {
            this.lastEmittedSelections.delete(sessionId);
        }
        // Also clear from database - only clear selected cartelas, preserve placed bet cartelas
        try {
            const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
            await Game.findOneAndUpdate({ sessionId }, {
                $set: {
                    'gameData.selectedCartelas': []
                    // Don't clear placedBetCartelas - they should remain for the game
                },
                lastActivity: new Date()
            });
        }
        catch (error) {
            console.error('Error clearing selected cartelas from database:', error);
        }
    }
    // Helper method to check if selections have changed
    haveSelectionsChanged(sessionId, newSelections) {
        const lastEmitted = this.lastEmittedSelections.get(sessionId) || new Set();
        if (lastEmitted.size !== newSelections.size) {
            return true;
        }
        for (const selection of newSelections) {
            if (!lastEmitted.has(selection)) {
                return true;
            }
        }
        return false;
    }
    // Helper method to update last emitted selections
    updateLastEmittedSelections(sessionId, selections) {
        this.lastEmittedSelections.set(sessionId, new Set(selections));
    }
}
exports.CashierSocketHandler = CashierSocketHandler;
//# sourceMappingURL=cashierSocket.js.map