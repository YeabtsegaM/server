import mongoose, { Document, Schema } from 'mongoose';

export interface IGlobalConfig extends Document {
  id: string;
  batTemplate: string;
  displayBaseUrl: string;
  // Betting Configuration
  shopMargin: number; // Shop's profit margin percentage
  systemFee: number; // System fee percentage
  updatedAt: Date;
}

const globalConfigSchema = new Schema<IGlobalConfig>({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'global-config'
  },
  batTemplate: {
    type: String,
    required: true,
    default: 'start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen'
  },
  displayBaseUrl: {
    type: String,
    required: true,
    default: 'http://localhost:3001?Bingo&='
  },
  // Betting Configuration with defaults
  shopMargin: {
    type: Number,
    required: true,
    default: 5, // 5% default shop margin
    min: 0,
    max: 100
  },
  systemFee: {
    type: Number,
    required: true,
    default: 2, // 2% default system fee
    min: 0,
    max: 100
  }
}, {
  timestamps: { createdAt: false, updatedAt: true }
});

export default mongoose.model<IGlobalConfig>('GlobalConfig', globalConfigSchema); 