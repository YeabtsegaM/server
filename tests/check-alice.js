const mongoose = require('mongoose');
require('dotenv').config();

async function checkAlice() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to MongoDB');

    const Cashier = require('../dist/models/Cashier').default;
    const cashier = await Cashier.findOne({ username: 'alicebrown' });
    
    if (cashier) {
      console.log('📋 Alice Brown Data:');
      console.log('ID:', cashier._id);
      console.log('Username:', cashier.username);
      console.log('Full Name:', cashier.fullName);
      console.log('Session ID:', cashier.sessionId);
      console.log('Display URL:', cashier.displayUrl);
      console.log('Is Active:', cashier.isActive);
      console.log('Created At:', cashier.createdAt);
      
      // Test password
      const testPassword = await cashier.comparePassword('password123');
      console.log('Password test (password123):', testPassword);
      
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

checkAlice(); 