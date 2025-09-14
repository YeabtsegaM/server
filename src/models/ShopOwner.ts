import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IShopOwner extends Document {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'shop_owner';
  isActive: boolean;
  shops: mongoose.Types.ObjectId[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const shopOwnerSchema = new Schema<IShopOwner>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['shop_owner'],
    default: 'shop_owner'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shops: [{
    type: Schema.Types.ObjectId,
    ref: 'Shop'
  }],
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password and normalize username before saving
shopOwnerSchema.pre('save', async function(next) {
  // Normalize username to lowercase for consistency (same as Admin model)
  if (this.isModified('username')) {
    this.username = this.username.toLowerCase().trim();
  }
  
  // Only hash password if it's a new password (not already hashed)
  if (!this.isModified('password')) return next();
  
  // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method (same as Admin model)
shopOwnerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing shop owner passwords:', error);
    return false;
  }
};

export default mongoose.model<IShopOwner>('ShopOwner', shopOwnerSchema); 