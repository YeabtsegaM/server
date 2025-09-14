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
const CompletedGameSchema = new mongoose_1.Schema({
    gameId: {
        type: mongoose_1.Schema.Types.Mixed, // Can be string or number
        required: true,
        index: true
    },
    cashierId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Cashier',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        required: true,
        default: 'completed',
        index: true
    },
    gameData: {
        gameStartTime: Date,
        gameEndTime: Date,
        finalProgress: {
            type: Number,
            required: true,
            default: 0
        },
        finalCalledNumbers: [Number],
        finalCurrentNumber: Number,
        finalCartelas: {
            type: Number,
            required: true,
            default: 0
        },
        finalTotalStack: {
            type: Number,
            required: true,
            default: 0
        },
        finalTotalWinStack: {
            type: Number,
            required: true,
            default: 0
        },
        // NEW: Aggregated financial data for reporting
        finalTotalShopMargin: {
            type: Number,
            required: true,
            default: 0
        },
        finalTotalSystemFee: {
            type: Number,
            required: true,
            default: 0
        },
        finalNetPrizePool: {
            type: Number,
            required: true,
            default: 0
        },
        finalDrawHistory: [{
                number: Number,
                timestamp: Date,
                type: String
            }],
        finalSelectedCartelas: [Number],
        finalPlacedBetCartelas: [Number],
        finalWinPatterns: [mongoose_1.Schema.Types.Mixed],
        // NEW: Verification results with multiple pattern support for reporting
        finalVerificationResults: {
            type: mongoose_1.Schema.Types.Mixed,
            default: {}
        },
        completedAt: {
            type: Date,
            required: true
        }
    },
    connectionStatus: {
        cashierConnected: Boolean,
        displayConnected: Boolean,
        lastCashierActivity: Date,
        lastDisplayActivity: Date
    },
    createdAt: {
        type: Date,
        required: true
    },
    completedAt: {
        type: Date,
        required: true,
        index: true
    }
}, {
    timestamps: true
});
// Indexes for efficient reporting queries
CompletedGameSchema.index({ 'gameData.completedAt': -1 }); // Most recent first
CompletedGameSchema.index({ cashierId: 1, 'gameData.completedAt': -1 }); // By cashier
CompletedGameSchema.index({ 'gameData.finalProgress': -1 }); // By game progress
CompletedGameSchema.index({ 'gameData.finalTotalStack': -1 }); // By total stack
CompletedGameSchema.index({ 'gameData.finalTotalWinStack': -1 }); // By win stack
// NEW: Indexes for financial reporting
CompletedGameSchema.index({ 'gameData.finalTotalShopMargin': -1 }); // By shop margin
CompletedGameSchema.index({ 'gameData.finalTotalSystemFee': -1 }); // By system fee
CompletedGameSchema.index({ 'gameData.finalNetPrizePool': -1 }); // By net prize pool
exports.default = mongoose_1.default.model('CompletedGame', CompletedGameSchema);
//# sourceMappingURL=CompletedGame.js.map