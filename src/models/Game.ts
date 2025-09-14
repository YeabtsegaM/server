import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  gameId: string;
  cashierId: string | null;
  sessionId: string;
  displayToken: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  isConnected: boolean;
  connectedAt: Date;
  disconnectedAt?: Date;
  lastActivity: Date;
  gameData?: {
    calledNumbers: number[];
    currentNumber?: number;
    progress: number;
    cartelas: number;
    stack: number; // Individual stake amount per cartela
    totalStack: number;
    totalWinStack: number;
    // Financial aggregation fields
    totalShopMargin: number;
    totalSystemFee: number;
    netPrizePool: number;
    netShopProfit: number; // Shop profit after system fee deduction

    selectedCartelas: number[]; // Add selected cartelas array
    placedBetCartelas: number[]; // Track which cartelas have placed bets
    winningCartelas: number[]; // Track winning cartelas when game is completed
  
    winPatterns?: string[];
    verifiedCartelas?: number[]; // Track which cartelas have been verified
    verificationResults?: Record<string, {
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
    }>; // Store verification results for each cartela with multiple pattern support
    hasWinners?: boolean; // Track if game has potential winners
    winnerCount?: number; // Count of potential winners
    lastWinnerCheck?: Date; // Last time winners were checked
    gameStartTime?: Date;
    gameEndTime?: Date;
    lastDrawTime?: Date;
    autoDrawConfig?: {
      cashierId: string;
      config: any;
      lastUpdated: Date;
    };
    drawHistory: Array<{
      number: number;
      timestamp: Date;
      drawnBy: 'manual' | 'auto';
    }>;
  };
  connectionStatus: {
    cashierConnected: boolean;
    displayConnected: boolean;
    lastCashierActivity?: Date;
    lastDisplayActivity?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>({
  gameId: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(value: string) {
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
      config: Schema.Types.Mixed,
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

export default mongoose.model<IGame>('Game', GameSchema); 