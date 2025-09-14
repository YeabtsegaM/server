const mongoose = require('mongoose');
require('dotenv').config();

async function testSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to MongoDB');

    // Use the compiled JavaScript path with default export
    const Cashier = require('../dist/models/Cashier').default;
    const cashier = await Cashier.findOne({ username: 'alicebrown' });
    
    if (cashier) {
      console.log('📋 Alice Brown Session Data:');
      console.log('Session ID:', cashier.sessionId);
      console.log('Display URL:', cashier.displayUrl);
      console.log('Is Connected:', cashier.isConnected);
      console.log('Last Activity:', cashier.lastActivity);
      
      // Generate BAT command
      const { generateBatCommand } = require('../dist/utils/sessionUtils');
      const batCommand = await generateBatCommand(cashier.sessionId);
      console.log('\n🎯 BAT Command:');
      console.log(batCommand);
      
    } else {
      console.log('❌ Alice Brown not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testSession(); 