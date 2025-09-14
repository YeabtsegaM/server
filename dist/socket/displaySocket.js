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
exports.DisplaySocketHandler = void 0;
const Game_1 = __importDefault(require("../models/Game"));
class DisplaySocketHandler {
    constructor(gameService, io) {
        this.displaySockets = new Map();
        this.gameService = gameService;
        this.io = io;
    }
    async handleConnection(socket, token) {
        if (!token) {
            socket.emit('display:unauthorized');
            socket.disconnect();
            return;
        }
        // Validate token format (must be UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(token)) {
            socket.emit('display:unauthorized');
            socket.disconnect();
            return;
        }
        try {
            // Find cashier with this sessionId
            const Cashier = (await Promise.resolve().then(() => __importStar(require('../models/Cashier')))).default;
            let cashier = await Cashier.findOne({ sessionId: token });
            if (!cashier) {
                // If no exact match, try to find any cashier with a displayUrl containing this token
                cashier = await Cashier.findOne({
                    $or: [
                        { sessionId: token },
                        { displayUrl: { $regex: token, $options: 'i' } }
                    ]
                });
            }
            if (!cashier) {
                socket.emit('display:unauthorized');
                socket.disconnect();
                return;
            }
            // Cast cashier._id to string to resolve TypeScript errors
            const cashierId = cashier._id.toString();
            // Join the display room for this session
            const displayRoom = `display:${token}`;
            socket.join(displayRoom);
            // Also join the game room for this session
            const gameRoom = `game:${token}`;
            socket.join(gameRoom);
            // Get the current game status for this session
            const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
            const currentGame = await Game.findOne({ sessionId: token });
            // Update cashier's display connection status
            await Cashier.findOneAndUpdate({ sessionId: token }, {
                isConnected: true,
                lastActivity: new Date()
            });
            // Update game connection status if a game exists
            if (currentGame) {
                await Game.findOneAndUpdate({ sessionId: token }, {
                    'connectionStatus.displayConnected': true,
                    'connectionStatus.lastDisplayActivity': new Date()
                });
            }
            else {
                // No game found - this might happen during game transitions
                // Try to find any game with this sessionId (including newly created ones)
                const anyGame = await Game.findOne({ sessionId: token });
                if (anyGame) {
                    await Game.findOneAndUpdate({ sessionId: token }, {
                        'connectionStatus.displayConnected': true,
                        'connectionStatus.lastDisplayActivity': new Date()
                    });
                }
                else {
                }
            }
            if (currentGame) {
                // Emit the current game status to the display immediately
                socket.emit('game_status_updated', {
                    gameId: currentGame.gameId,
                    status: currentGame.status,
                    gameData: currentGame.gameData || {},
                    timestamp: new Date()
                });
                // Also emit the current game data
                socket.emit('game_data_updated', {
                    id: currentGame.gameId,
                    status: currentGame.status,
                    gameData: currentGame.gameData || {},
                    timestamp: new Date()
                });
            }
            else {
            }
            // Notify cashier that display is connected
            const cashierRoom = `cashier:${cashierId}`;
            this.io.to(cashierRoom).emit('display:connection_status', {
                connected: true,
                sessionId: token,
                cashierId: cashierId,
                timestamp: new Date()
            });
            // CRITICAL FIX: Also emit to the game room to ensure all clients get notified
            this.io.to(gameRoom).emit('display:connection_status', {
                connected: true,
                sessionId: token,
                cashierId: cashierId,
                timestamp: new Date()
            });
            // CRITICAL FIX: Also emit to the display room for consistency
            this.io.to(`display:${token}`).emit('display:connection_status', {
                connected: true,
                sessionId: token,
                cashierId: cashierId,
                timestamp: new Date()
            });
            // Store display socket reference
            this.displaySockets.set(token, socket);
            // Set up event handlers for this display
            this.setupEventHandlers(socket, token, cashierId);
            // Set up heartbeat to maintain connection status
            this.setupHeartbeat(socket, token, cashierId);
            // CRITICAL FIX: Set up reconnection handler
            socket.on('reconnect', async () => {
                // Update connection status
                await Game.findOneAndUpdate({ sessionId: token }, {
                    'connectionStatus.displayConnected': true,
                    'connectionStatus.lastDisplayActivity': new Date()
                });
                // Notify cashier about reconnection
                this.io.to(`cashier:${cashierId}`).emit('display:connection_status', {
                    connected: true,
                    sessionId: token,
                    cashierId: cashierId,
                    timestamp: new Date()
                });
                // CRITICAL FIX: Also emit game status sync to keep cashier updated
                const currentGame = await Game.findOne({ sessionId: token });
                if (currentGame) {
                    this.io.to(`cashier:${cashierId}`).emit('game:status_sync', {
                        sessionId: token,
                        status: currentGame.status,
                        gameId: currentGame.gameId,
                        timestamp: new Date()
                    });
                }
            });
        }
        catch (error) {
            console.error('Error handling display connection:', error);
            socket.emit('display:unauthorized');
            socket.disconnect();
        }
    }
    setupEventHandlers(socket, token, cashierId) {
        // Setup fast real-time update handlers for immediate updates
        this.setupFastUpdateHandlers(socket, token);
        // Handle display joining specific display room
        socket.on('join_display_room', (data) => {
            if (data.sessionId) {
                console.log(`🔗 Display joining display room: ${data.sessionId}`);
                socket.join(`display:${data.sessionId}`);
                socket.emit('display:room_joined', { sessionId: data.sessionId });
            }
        });
        // Handle game room joining
        socket.on('join_game', (data) => {
            if (token) { // Use token for game room joining
                socket.join(data.gameId);
                socket.emit('game:joined', { gameId: data.gameId });
            }
        });
        // Handle game room leaving
        socket.on('leave_game', (data) => {
            if (token) { // Use token for game room leaving
                socket.leave(data.gameId);
                socket.emit('game:left', { gameId: data.gameId });
            }
        });
        socket.on('start_game', (data) => {
            this.io.to('display').emit('game:started', data);
        });
        // Handle verification events
        socket.on('cartela:verified', (data) => {
            // Forward the verification event to the display
            socket.emit('cartela:verified', data);
        });
        // Handle get_game_data request from display
        socket.on('get_game_data', async (data) => {
            if (token) {
                try {
                    // First get the game to get its gameId
                    const existingGame = await Game_1.default.findOne({ sessionId: token });
                    if (!existingGame) {
                        socket.emit('game_data_response', { error: 'No active game found' });
                        return;
                    }
                    // Use aggregation service to get real-time game data with latest bet totals
                    const { GameAggregationService } = await Promise.resolve().then(() => __importStar(require('../services/gameAggregationService')));
                    const currentGame = await GameAggregationService.getRealTimeGameData(token, existingGame.gameId);
                    if (currentGame && currentGame.gameData) {
                        // Create enhanced game data with real-time aggregated betting information
                        const enhancedGameData = {
                            id: currentGame.gameId,
                            status: currentGame.status,
                            sessionId: token,
                            gameData: {
                                // Real-time aggregated betting data
                                cartelas: currentGame.gameData.cartelas || 0,
                                totalStack: currentGame.gameData.totalStack || 0,
                                totalWinStack: currentGame.gameData.totalWinStack || 0,
                                totalShopMargin: currentGame.gameData.totalShopMargin || 0,
                                totalSystemFee: currentGame.gameData.totalSystemFee || 0,
                                netPrizePool: currentGame.gameData.netPrizePool || 0,
                                placedBetCartelas: currentGame.gameData.placedBetCartelas || [],
                                selectedCartelas: currentGame.gameData.selectedCartelas || [],
                                // Include other game data
                                progress: currentGame.gameData.progress || 0,
                                calledNumbers: currentGame.gameData.calledNumbers || [],
                                currentNumber: currentGame.gameData.currentNumber || null,
                                drawHistory: currentGame.gameData.drawHistory || [],
                                gameStartTime: currentGame.gameData.gameStartTime,
                                gameEndTime: currentGame.gameData.gameEndTime,
                                lastDrawTime: currentGame.gameData.lastDrawTime,
                                winPatterns: currentGame.gameData.winPatterns || []
                            }
                        };
                        socket.emit('game_data_response', enhancedGameData);
                    }
                    else {
                        // Fallback to service data only if no database data
                        try {
                            const gameData = await this.gameService.getGameData(token);
                            socket.emit('game_data_response', gameData);
                        }
                        catch (serviceError) {
                            console.error('Error getting service game data:', serviceError);
                            socket.emit('game_data_response', { error: 'Failed to get game data' });
                        }
                    }
                }
                catch (error) {
                    console.error('Error getting game data for display:', error);
                    socket.emit('game_data_response', { error: 'Failed to get game data' });
                }
            }
            else {
                socket.emit('game_data_response', { error: 'No active game session' });
            }
        });
        // Handle request for current cartela selections from display
        socket.on('get_cartela_selections', async (data) => {
            if (token) {
                try {
                    const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                    const game = await Game.findOne({ sessionId: token });
                    if (game && game.gameData && game.gameData.selectedCartelas) {
                        socket.emit('cartela_selections_response', {
                            selectedCartelas: game.gameData.selectedCartelas,
                            timestamp: new Date()
                        });
                    }
                    else {
                        socket.emit('cartela_selections_response', {
                            selectedCartelas: [],
                            timestamp: new Date()
                        });
                    }
                }
                catch (error) {
                    console.error('Error getting cartela selections for display:', error);
                    socket.emit('cartela_selections_response', {
                        selectedCartelas: [],
                        timestamp: new Date()
                    });
                }
            }
            else {
                socket.emit('cartela_selections_response', {
                    selectedCartelas: [],
                    timestamp: new Date()
                });
            }
        });
        // Handle get_display_status request
        socket.on('get_display_status', async (data) => {
            if (data.sessionId === token) {
                try {
                    const game = await Game_1.default.findOne({ sessionId: data.sessionId });
                    const displayConnected = game?.connectionStatus?.displayConnected || false;
                    // Emit display connection status to the requesting client
                    socket.emit('display:connection_status', {
                        connected: displayConnected,
                        sessionId: data.sessionId,
                        timestamp: new Date()
                    });
                }
                catch (error) {
                    console.error('Error getting display status:', error);
                    socket.emit('display:connection_status', {
                        connected: false,
                        sessionId: data.sessionId
                    });
                }
            }
        });
        // Handle real-time bet placement updates
        socket.on('bets_placed', (data) => {
            // The display will handle this event to update its game state
        });
        // Handle real-time game data updates
        socket.on('game_data_updated', (data) => {
            // The display will handle this event to update its game state
        });
        // Handle real-time placed bets updates
        socket.on('placed_bets_updated', (data) => {
            // The display will handle this event to update its betting display
        });
        // Handle cashier connection status updates
        socket.on('cashier:connection_status', async (data) => {
            if (token) {
                try {
                    // Update the database connection status
                    await Game_1.default.findOneAndUpdate({ sessionId: token }, {
                        'connectionStatus.cashierConnected': data.connected,
                        'connectionStatus.lastCashierActivity': new Date(),
                        lastActivity: new Date()
                    }, { new: true });
                    // Emit updated connection status to display
                    socket.emit('cashier:connection_status', {
                        connected: data.connected,
                        sessionId: token
                    });
                    // Broadcast the updated connection status to all clients
                    await this.gameService.emitConnectionStatusUpdate(token);
                }
                catch (error) {
                    console.error('Error handling cashier:connection_status event:', error);
                }
            }
        });
        // Handle display disconnect
        socket.on('disconnect', async () => {
            try {
                // Real-time updates are handled automatically - no cleanup needed
                // Update game connection status if we have a game session
                if (token) {
                    // Update the database directly for reliability
                    await Game_1.default.findOneAndUpdate({ sessionId: token }, {
                        'connectionStatus.displayConnected': false,
                        'connectionStatus.lastDisplayActivity': new Date(),
                        lastActivity: new Date()
                    }, { new: true });
                    // Notify cashiers in the room about display disconnection
                    this.io.to(`cashier:${cashierId}`).emit('display:connection_status', {
                        connected: false,
                        sessionId: token
                    });
                    // CRITICAL FIX: Also emit to game room and display room for consistency
                    this.io.to(`game:${token}`).emit('display:connection_status', {
                        connected: false,
                        sessionId: token
                    });
                    this.io.to(`display:${token}`).emit('display:connection_status', {
                        connected: false,
                        sessionId: token
                    });
                    // Also emit to all clients in the room
                    await this.gameService.emitConnectionStatusUpdate(token);
                }
            }
            catch (error) {
                console.error('Error handling display disconnect:', error);
            }
        });
        // Handle display status updates
        socket.on('display:status_update', (data) => {
            if (token) {
                socket.to(`display:${token}`).emit('display:status_updated', data);
            }
        });
        // Handle display ready state
        socket.on('display:ready', () => {
            if (token) {
                socket.to(`display:${token}`).emit('display:ready', { timestamp: new Date() });
            }
        });
        // Handle game cleared event
        socket.on('game_cleared', () => {
            // Clear the display when game ends
            socket.emit('game_cleared', { message: 'Game ended and cleared' });
        });
        // Handle game reset event
        socket.on('game_reset', () => {
            // Reset the display when game resets
            socket.emit('game_reset', { message: 'Game reset' });
        });
        // Handle game status changes
        socket.on('game_status_changed', (data) => {
            // The display will handle this event to update its game state
        });
        // Handle game ended event
        socket.on('game_ended', (data) => {
            // The display will handle this event to update its game state
        });
        // Handle comprehensive game reset event
        socket.on('game_comprehensive_reset', (data) => {
            // The display will handle this event to reset for new game
        });
        // Handle page refresh request
        socket.on('refresh_pages', (data) => {
            // The display will handle this event to refresh the page
        });
        // Handle close cartelas event
        socket.on('close_cartelas', (data) => {
            // The display will handle this event to close cartela display
        });
        // Handle placed bets updated event
        socket.on('placed_bets_updated', (data) => {
            // The display will handle this event to update betting display
        });
    }
    /**
     * Setup fast real-time update handlers for immediate updates
     * These handlers provide instant updates without delays
     */
    setupFastUpdateHandlers(socket, token) {
        // Handle immediate game data updates
        socket.on('request_immediate_update', async (data) => {
            if (data.sessionId) {
                try {
                    // Use enhanced real-time service for immediate updates
                    const { RealTimeUpdateService } = await Promise.resolve().then(() => __importStar(require('../services/realTimeUpdateService')));
                    const realTimeService = new RealTimeUpdateService(this.io);
                    // Force immediate update
                    await realTimeService.updateGameDataImmediate(data.sessionId);
                    socket.emit('immediate_update_completed', {
                        sessionId: data.sessionId,
                        timestamp: new Date()
                    });
                }
                catch (error) {
                    console.error(`Error in immediate update for session ${data.sessionId}:`, error);
                    socket.emit('immediate_update_error', { error: 'Failed to complete immediate update' });
                }
            }
        });
        // Handle force page refresh requests
        socket.on('request_page_refresh', async (data) => {
            if (data.sessionId) {
                try {
                    const { RealTimeUpdateService } = await Promise.resolve().then(() => __importStar(require('../services/realTimeUpdateService')));
                    const realTimeService = new RealTimeUpdateService(this.io);
                    // Force page refresh for all clients
                    realTimeService.forcePageRefresh(data.sessionId, data.reason || 'Manual refresh requested');
                    socket.emit('page_refresh_triggered', {
                        sessionId: data.sessionId,
                        timestamp: new Date()
                    });
                }
                catch (error) {
                    console.error(`Error triggering page refresh for session ${data.sessionId}:`, error);
                }
            }
        });
        // Handle 3D shuffle events from cashier
        socket.on('shuffle_number_pool', async (data) => {
            if (data.sessionId) {
                try {
                    // Emit shuffle event to all clients in the display room
                    const displayRoom = `display:${data.sessionId}`;
                    this.io.to(displayRoom).emit('display:shuffle_animation', {
                        sessionId: data.sessionId,
                        cashierId: data.cashierId,
                        timestamp: new Date(),
                        action: 'start'
                    });
                }
                catch (error) {
                    console.error(`Error handling 3D shuffle for session ${data.sessionId}:`, error);
                }
            }
        });
        // Handle direct shuffle animation events (for when cashier sends display:shuffle_animation)
        socket.on('display:shuffle_animation', async (data) => {
            if (data.sessionId) {
                try {
                    // Forward the event to all clients in the display room
                    const displayRoom = `display:${data.sessionId}`;
                    this.io.to(displayRoom).emit('display:shuffle_animation', {
                        sessionId: data.sessionId,
                        cashierId: data.cashierId,
                        timestamp: new Date(),
                        action: data.action
                    });
                }
                catch (error) {
                    console.error(`Error handling direct shuffle animation for session ${data.sessionId}:`, error);
                }
            }
        });
    }
    /**
     * Setup heartbeat to maintain display connection status
     */
    setupHeartbeat(socket, token, cashierId) {
        const heartbeatInterval = setInterval(async () => {
            try {
                // Check if socket is still connected
                if (!socket.connected) {
                    clearInterval(heartbeatInterval);
                    return;
                }
                // Update display connection status in database
                const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
                const game = await Game.findOne({ sessionId: token });
                if (game) {
                    await Game.findOneAndUpdate({ sessionId: token }, {
                        'connectionStatus.displayConnected': true,
                        'connectionStatus.lastDisplayActivity': new Date()
                    });
                    // Emit connection status to cashier
                    const cashierRoom = `cashier:${cashierId}`;
                    this.io.to(cashierRoom).emit('display:connection_status', {
                        connected: true,
                        sessionId: token,
                        cashierId: cashierId,
                        timestamp: new Date()
                    });
                }
            }
            catch (error) {
                console.error('Error in display heartbeat:', error);
            }
        }, 1000); // Every 1 seconds for better responsiveness
        // Clean up interval on disconnect
        socket.on('disconnect', () => {
            clearInterval(heartbeatInterval);
        });
    }
}
exports.DisplaySocketHandler = DisplaySocketHandler;
//# sourceMappingURL=displaySocket.js.map