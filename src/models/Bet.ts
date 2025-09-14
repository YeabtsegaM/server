import mongoose, { Schema, Document } from 'mongoose';

export interface IBet extends Document {
  ticketNumber: string; // 13-digit ticket number (0000000000001, 0000000000002, etc.)
  betId: string;
  gameId: string | number;
  cashierId: mongoose.Types.ObjectId;
  sessionId: string;
  cartelaId: number;
  stake: number;
  betType: 'single' | 'multiple' | 'combination';
  betStatus: 'pending' | 'active' | 'won' | 'lost' | 'cancelled' | 'won_redeemed' | 'lost_redeemed';
  gameProgress: number; // Progress when bet was placed
  selectedNumbers: number[]; // Numbers selected on the cartela
  winPattern?: string; // Winning pattern if applicable
  win: number; // Win amount (0 initially, updated to prize amount when redeemed)
  notes?: string;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  placedAt: Date;
  settledAt?: Date;
  // NEW: Manual verification locking fields
  verificationLocked?: boolean; // Whether verification is manually locked by cashier
  verificationLockedAt?: Date; // When verification was locked
  verificationLockedBy?: mongoose.Types.ObjectId; // Who locked the verification
}

const BetSchema = new Schema<IBet>({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v: string) {
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
      validator: function(v: number) {
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
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
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

const Bet = mongoose.model<IBet>('Bet', BetSchema);
export { Bet };
export default Bet;
