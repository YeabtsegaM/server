import mongoose, { Schema, Document } from 'mongoose';

export interface ICompletedGame extends Document {
  gameId: string | number;
  cashierId: mongoose.Types.ObjectId;
  sessionId: string;
  status: string;
  gameData: {
    gameStartTime?: Date;
    gameEndTime?: Date;
    finalProgress: number;
    finalCalledNumbers: number[];
    finalCurrentNumber: number | null;
    finalCartelas: number;
    finalTotalStack: number;
    finalTotalWinStack: number;
    // NEW: Aggregated financial data for reporting
    finalTotalShopMargin: number;
    finalTotalSystemFee: number;
    finalNetPrizePool: number;
    finalDrawHistory: Array<{
      number: number;
      timestamp: Date;
      type: string;
    }>;
    finalSelectedCartelas: number[];
    finalPlacedBetCartelas: number[];
    finalWinPatterns: any[];
    // NEW: Verification results with multiple pattern support for reporting
    finalVerificationResults?: Record<string, {
      status: 'won' | 'lost';
      patterns: string[]; // Array of pattern IDs that matched
      patternNames: string[]; // Array of pattern names that matched
      allMatchedPatterns: Array<{
        patternId: string;
        patternName: string;
        matchedNumbers: number[];
      }>; // Detailed information about all matching patterns
      matchedNumbers: number[];
      verifiedAt: Date;
      verifiedBy: string;
      drawnNumbers: number[];
    }>;

    completedAt: Date;
  };
  connectionStatus?: {
    cashierConnected: boolean;
    displayConnected: boolean;
    lastCashierActivity?: Date;
    lastDisplayActivity?: Date;
  };
  createdAt: Date;
  completedAt: Date;
}

const CompletedGameSchema = new Schema<ICompletedGame>({
  gameId: {
    type: Schema.Types.Mixed, // Can be string or number
    required: true,
    index: true
  },
  cashierId: {
    type: Schema.Types.ObjectId,
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
    finalWinPatterns: [Schema.Types.Mixed],
    // NEW: Verification results with multiple pattern support for reporting
    finalVerificationResults: {
      type: Schema.Types.Mixed,
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

export default mongoose.model<ICompletedGame>('CompletedGame', CompletedGameSchema);
