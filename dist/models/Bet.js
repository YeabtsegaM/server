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
exports.Bet = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BetSchema = new mongoose_1.Schema({
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        validate: {
            validator: function (v) {
                return /^\d{13}$/.test(v);
            },
            message: 'Ticket number must be exactly 13 digits'
        }
    },
    betId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
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
    cartelaId: {
        type: Number,
        required: true,
        index: true
    },
    stake: {
        type: Number,
        required: true,
        min: 5, // Will be validated against admin config at runtime
        validate: {
            validator: function (v) {
                // Basic validation: stake must be at least Br. 5
                return v >= 5;
            },
            message: 'Stake amount must be at least Br. 5.00'
        }
    },
    betType: {
        type: String,
        enum: ['single', 'multiple', 'combination'],
        default: 'single',
        required: true
    },
    betStatus: {
        type: String,
        enum: ['pending', 'active', 'won', 'lost', 'cancelled', 'won_redeemed', 'lost_redeemed'],
        default: 'pending',
        required: true,
        index: true
    },
    gameProgress: {
        type: Number,
        required: true,
        min: 0,
        max: 75
    },
    selectedNumbers: [{
            type: Number,
            min: 1,
            max: 75
        }],
    winPattern: {
        type: String,
        trim: true
    },
    win: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Cashier'
    },
    verifiedAt: {
        type: Date
    },
    placedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    settledAt: {
        type: Date
    },
    // NEW: Manual verification locking fields
    verificationLocked: {
        type: Boolean,
        default: false,
        index: true
    },
    verificationLockedAt: {
        type: Date
    },
    verificationLockedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Cashier'
    }
}, {
    timestamps: true
});
// Indexes for efficient querying
BetSchema.index({ gameId: 1, cartelaId: 1 }); // Unique bet per cartela per game
BetSchema.index({ cashierId: 1, placedAt: -1 }); // Cashier bets by date
BetSchema.index({ betStatus: 1, placedAt: -1 }); // Bets by status
BetSchema.index({ stake: -1 }); // High value bets
BetSchema.index({ isVerified: 1 }); // Verification status
BetSchema.index({ verificationLocked: 1 }); // Verification locked status
const Bet = mongoose_1.default.model('Bet', BetSchema);
exports.Bet = Bet;
exports.default = Bet;
//# sourceMappingURL=Bet.js.map