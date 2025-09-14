"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketManager = void 0;
const cashierSocket_1 = require("./cashierSocket");
const displaySocket_1 = require("./displaySocket");
const adminSocket_1 = require("./adminSocket");
const gameService_1 = __importDefault(require("../services/gameService"));
class SocketManager {
    constructor(io) {
        this.io = io;
        this.gameService = new gameService_1.default(io);
        // Initialize socket handlers
        this.cashierHandler = new cashierSocket_1.CashierSocketHandler(this.gameService, io);
        this.displayHandler = new displaySocket_1.DisplaySocketHandler(this.gameService, io);
        this.adminHandler = new adminSocket_1.AdminSocketHandler(this.gameService, io);
        this.setupConnectionHandler();
    }
    setupConnectionHandler() {
        this.io.on('connection', async (socket) => {
            const clientType = socket.handshake.query.type;
            const cashierId = socket.handshake.query.cashierId;
            const displayToken = socket.handshake.query.displayToken;
            const sessionId = socket.handshake.query.s;
            console.log(`🔌 New socket connection:`, {
                socketId: socket.id,
                clientType,
                cashierId,
                displayToken,
                sessionId,
                timestamp: new Date()
            });
            try {
                if (clientType === 'cashier') {
                    await this.cashierHandler.handleConnection(socket, cashierId, sessionId);
                }
                else if (displayToken || sessionId) {
                    await this.displayHandler.handleConnection(socket, displayToken || sessionId);
                }
                else if (clientType === 'admin') {
                    await this.adminHandler.handleConnection(socket);
                }
                else {
                    console.log(`❌ Unauthorized connection attempt:`, { clientType, cashierId, displayToken, sessionId });
                    socket.emit('unauthorized');
                    socket.disconnect();
                }
                // Add disconnect handler for debugging
                socket.on('disconnect', (reason) => {
                    console.log(`🔌 Socket disconnected:`, {
                        socketId: socket.id,
                        clientType,
                        cashierId,
                        displayToken,
                        sessionId,
                        reason,
                        timestamp: new Date()
                    });
                });
            }
            catch (error) {
                console.error('❌ Socket connection error:', error);
                socket.emit('error', { message: 'Connection failed' });
                socket.disconnect();
            }
        });
    }
    getGameService() {
        return this.gameService;
    }
}
exports.SocketManager = SocketManager;
//# sourceMappingURL=socketManager.js.map