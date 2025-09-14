import mongoose, { Document, Schema } from 'mongoose';

export interface IShop extends Document {
  shopName: string;
  location: string;
  owner: mongoose.Types.ObjectId;
  margin: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>({
  shopName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'ShopOwner',
    required: true
  },
  margin: {
    type: Number,
    required: true,
    default: 10,
    min: 10,
    max: 45
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
shopSchema.index({ shopName: 1 });
shopSchema.index({ owner: 1 });
shopSchema.index({ status: 1 });
shopSchema.index({ createdAt: -1 });

export default mongoose.model<IShop>('Shop', shopSchema); 