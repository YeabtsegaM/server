import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'YeBingoSec123';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Suppress Mongoose index creation logs by overriding console.log
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('Mongoose:') && message.includes('createIndex')) {
        return; // Suppress index creation logs
      }
      originalLog.apply(console, args);
    };

    // Performance optimizations
    await mongoose.connect(MONGODB_URI, {
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      // Server selection timeout
      serverSelectionTimeoutMS: 5000,
      // Socket timeout
      socketTimeoutMS: 45000,
      // Buffer commands
      bufferCommands: true,
      // Auto index
      autoIndex: process.env.NODE_ENV !== 'production',
      // Auto create
      autoCreate: process.env.NODE_ENV !== 'production'
    });
    
    // Set global options - disable debug mode to suppress index creation logs
    mongoose.set('debug', false);
    
    console.log('✅ Connected to MongoDB');
    
    // Restore original console.log
    console.log = originalLog;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}; 
