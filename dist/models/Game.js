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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const GameSchema = new mongoose_1.Schema({
    gameId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (value) {
                // Ensure game ID is a valid 4-digit number (4000-4999)
                const gameNumber = parseInt(value, 10);
                return !isNaN(gameNumber) && gameNumber >= 4000 && gameNumber <= 4999;
            },
            message: 'Game ID must be a valid 4-digit number (4000-4999)'
        }
    },
    cashierId: {
        type: String,
        required: false, // Allow null for waiting sessions
        ref: 'Cashier'
    },
    sessionId: {
        type: String,
        required: true
    },
    displayToken: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'paused', 'completed'],
        default: 'waiting'
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    connectedAt: {
        type: Date,
        default: Date.now
    },
    disconnectedAt: {
        type: Date
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    gameData: {
        calledNumbers: [Number],
        currentNumber: Number,
        progress: {
            type: Number,
            default: 0
        },
        cartelas: {
            type: Number,
            default: 0
        },
        stack: {
            type: Number,
            default: 0
        },
        totalStack: {
            type: Number,
            default: 0
        },
        totalWinStack: {
            type: Number,
            default: 0
        },
        // Financial aggregation fields
        totalShopMargin: {
            type: Number,
            default: 0
        },
        totalSystemFee: {
            type: Number,
            default: 0
        },
        netPrizePool: {
            type: Number,
            default: 0
        },
        netShopProfit: {
            type: Number,
            default: 0
        },
        selectedCartelas: {
            type: [Number],
            default: []
        },
        placedBetCartelas: {
            type: [Number],
            default: []
        },
        winningCartelas: {
            type: [Number],
            default: []
        },
        winPatterns: [String],
        verifiedCartelas: {
            type: [Number],
            default: []
        },
        verificationResults: {
            type: Map,
            of: Object,
            default: {}
        },
        hasWinners: {
            type: Boolean,
            default: false
        },
        winnerCount: {
            type: Number,
            default: 0
        },
        lastWinnerCheck: Date,
        gameStartTime: Date,
        gameEndTime: Date,
        lastDrawTime: Date,
        autoDrawConfig: {
            cashierId: String,
            config: mongoose_1.Schema.Types.Mixed,
            lastUpdated: {
                type: Date,
                default: Date.now
            }
        },
        drawHistory: [{
                number: Number,
                timestamp: {
                    type: Date,
                    default: Date.now
                },
                drawnBy: {
                    type: String,
                    enum: ['manual', 'auto'],
                    default: 'manual'
                }
            }]
    },
    connectionStatus: {
        cashierConnected: {
            type: Boolean,
            default: false
        },
        displayConnected: {
            type: Boolean,
            default: false
        },
        lastCashierActivity: Date,
        lastDisplayActivity: Date
    }
}, {
    timestamps: true
});
// Index for efficient queries
GameSchema.index({ cashierId: 1, sessionId: 1 });
GameSchema.index({ isConnected: 1 });
GameSchema.index({ status: 1 });
GameSchema.index({ 'connectionStatus.cashierConnected': 1 });
GameSchema.index({ 'connectionStatus.displayConnected': 1 });
// Compound index to prevent duplicate game IDs per cashier per day
GameSchema.index({
    cashierId: 1,
    gameId: 1,
    createdAt: 1
}, {
    unique: false, // Allow same game ID on different days
    name: 'cashier_game_date_index'
});
// Index for game ID uniqueness check
GameSchema.index({ gameId: 1 }, { unique: true });
// Index for date-based queries
GameSchema.index({ createdAt: 1 });
GameSchema.index({ lastActivity: 1 });
exports.default = mongoose_1.default.model('Game', GameSchema);
//# sourceMappingURL=Game.js.map