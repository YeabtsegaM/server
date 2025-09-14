import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cashier from '../models/Cashier';
import { generateSessionId, generateDisplayUrl } from '../utils/sessionUtils';

// Load environment variables
dotenv.config();

const updateAllCashiersSession = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to MongoDB');

    // Find all cashiers
    const allCashiers = await Cashier.find({});
    console.log(`📋 Found ${allCashiers.length} total cashiers`);

    // Find cashiers that don't have a sessionId
    const cashiersToUpdate = allCashiers.filter(cashier => !cashier.sessionId);
    
    if (cashiersToUpdate.length === 0) {
      console.log('✅ All cashiers already have session IDs. No updates needed!');
      return;
    }

    console.log(`📋 Found ${cashiersToUpdate.length} cashiers to update...`);

    for (const cashier of cashiersToUpdate) {
      const sessionId = generateSessionId();
      const displayUrl = generateDisplayUrl(sessionId);

      cashier.sessionId = sessionId;
      cashier.displayUrl = displayUrl;
      cashier.isConnected = false;
      cashier.lastActivity = new Date();

      await cashier.save();
      console.log(`✅ Updated cashier: ${cashier.username} with Session ID: ${sessionId}`);
    }

    console.log('🎉 All cashiers updated successfully!');

  } catch (error) {
    console.error('❌ Error updating cashiers session data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

updateAllCashiersSession(); 