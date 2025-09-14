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
const express_1 = __importDefault(require("express"));
const cartelaController_1 = require("../controllers/cartelaController");
const betController_1 = require("../controllers/betController");
const router = express_1.default.Router();
// Debug endpoint to test display routes
router.get('/debug', (req, res) => {
    res.json({
        message: 'Display routes are working',
        query: req.query,
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
});
// Public route for display to fetch cartelas (no authentication required)
router.get('/cartelas', cartelaController_1.getCartelasForDisplay);
// Public route for display to fetch placed bet cartelas (no authentication required)
router.get('/placed-cartelas', betController_1.getPlacedBetCartelasForDisplay);
// Public route to get display connection status (no authentication required)
router.get('/connection-status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Get the socket.io instance
        const { io } = req.app.locals;
        if (!io) {
            return res.status(500).json({
                success: false,
                error: 'Socket.io not available'
            });
        }
        // Check display room for active sockets
        const displaySockets = await io.in(`display:${sessionId}`).fetchSockets();
        const isDisplayConnected = displaySockets.length > 0;
        // Check game room for active sockets
        const gameSockets = await io.in(`game:${sessionId}`).fetchSockets();
        const isGameActive = gameSockets.length > 0;
        // Get database connection status
        const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
        const game = await Game.findOne({ sessionId });
        const dbDisplayConnected = game?.connectionStatus?.displayConnected || false;
        res.json({
            success: true,
            data: {
                sessionId,
                displayConnected: isDisplayConnected,
                dbDisplayConnected,
                displaySocketsCount: displaySockets.length,
                gameSocketsCount: gameSockets.length,
                isGameActive,
                gameStatus: game?.status || 'unknown',
                lastActivity: game?.connectionStatus?.lastDisplayActivity || null,
                timestamp: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error getting display connection status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get connection status'
        });
    }
});
exports.default = router;
//# sourceMappingURL=display.js.map