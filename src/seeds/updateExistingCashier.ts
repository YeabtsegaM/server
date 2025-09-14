import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cashier from '../models/Cashier';
import { generateSessionId, generateDisplayUrl } from '../utils/sessionUtils';

// Load environment variables
dotenv.config();

const updateExistingCashier = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to MongoDB');

    // Find the existing cashier
    const cashier = await Cashier.findOne({ username: 'alicebrown' });
    
    if (!cashier) {
      console.log('❌ Cashier alicebrown not found');
      return;
    }

    console.log('📋 Found cashier:', {
      id: cashier._id,
      username: cashier.username,
      fullName: cashier.fullName,
      sessionId: cashier.sessionId || 'Not set'
    });

    // Generate session data
    const sessionId = generateSessionId();
    const displayUrl = generateDisplayUrl(sessionId);

    // Update cashier with session data
    cashier.sessionId = sessionId;
    cashier.displayUrl = displayUrl;
    cashier.isConnected = false;
    cashier.lastActivity = new Date();

    await cashier.save();

    console.log('✅ Session data updated for alicebrown:');
    console.log('Session ID:', sessionId);
    console.log('Display URL:', displayUrl);

    // Disconnect from database
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error updating cashier:', error);
    process.exit(1);
  }
};

// Run the script
updateExistingCashier(); 