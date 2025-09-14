import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICashier extends Document {
  shop: mongoose.Types.ObjectId;
  fullName: string;
  username: string;
  password: string;
  isActive: boolean;
  role: 'cashier';
  lastLogin?: Date;
  // Session management fields
  sessionId?: string;
  displayUrl?: string;
  isConnected?: boolean;
  lastActivity?: Date;
  // Game ID tracking - NEW 4-digit system
  currentGameId?: number;
  lastGameDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const cashierSchema = new Schema<ICashier>({
  shop: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop assignment is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9._]+$/, 'Username can only contain letters, numbers, dots, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['cashier'],
    default: 'cashier'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Session management fields
  sessionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  displayUrl: {
    type: String,
    trim: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: null
  },
  // Game ID tracking - NEW 4-digit system (4000-4999)
  currentGameId: {
    type: Number,
    default: 4000,
    min: [4000, 'Game ID must be at least 4000'],
    max: [4999, 'Game ID cannot exceed 4999'],
    validate: {
      validator: function(value: number) {
        return value >= 4000 && value <= 4999;
      },
      message: 'Game ID must be a 4-digit number between 4000 and 4999'
    }
  },
  lastGameDate: {
    type: Date,
    default: null
  },

}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

// Add compound index for game ID tracking to prevent duplication
cashierSchema.index({ currentGameId: 1, lastGameDate: 1 });

// Add index for session management
cashierSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cashierSchema.index({ username: 1 }, { unique: true });

// Hash password before saving
cashierSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
cashierSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<ICashier>('Cashier', cashierSchema); 