const mongoose = require('mongoose');
require('dotenv').config();

async function simpleTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to MongoDB');

    // Direct database query
    const cashier = await mongoose.connection.db.collection('cashiers').findOne({ username: 'alicebrown' });
    
    if (cashier) {
      console.log('📋 Alice Brown Raw Data:');
      console.log('Session ID:', cashier.sessionId);
      console.log('Display URL:', cashier.displayUrl);
      console.log('Is Connected:', cashier.isConnected);
      console.log('Last Activity:', cashier.lastActivity);
      
      // Generate a simple BAT command
      if (cashier.sessionId) {
        const batCommand = `start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen "http://localhost:3001?Bingo&=${cashier.sessionId}"`;
        console.log('\n🎯 BAT Command:');
        console.log(batCommand);
      } else {
        console.log('\n❌ No session ID found for Alice Brown');
      }
      
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

simpleTest(); 