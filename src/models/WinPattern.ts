import mongoose, { Document, Schema } from 'mongoose';

export interface IWinPattern extends Document {
  name: string;
  pattern: boolean[][];
  isActive: boolean;
  cashierId: string;
  shopId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WinPatternSchema = new Schema<IWinPattern>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  pattern: {
    type: [[Boolean]],
    required: true,
    validate: {
      validator: function(pattern: boolean[][]) {
        return pattern.length === 5 && pattern.every(row => row.length === 5);
      },
      message: 'Pattern must be a 5x5 grid'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  cashierId: {
    type: String,
    required: true,
    index: true
  },
  shopId: {
    type: String,
    required: false,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
WinPatternSchema.index({ cashierId: 1, isActive: 1 });
WinPatternSchema.index({ shopId: 1, isActive: 1 });

// Ensure unique pattern names per cashier
WinPatternSchema.index({ cashierId: 1, name: 1 }, { unique: true });

export const WinPattern = mongoose.model<IWinPattern>('WinPattern', WinPatternSchema); 