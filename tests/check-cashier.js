const mongoose = require('mongoose');
require('dotenv').config();

async function checkCashier() {
  console.log('🔍 Checking Cashier in Database...');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to database');
    
    // Import Cashier model
    const Cashier = require('../src/models/Cashier').default;
    
    // Check for cashier with username 'alicebrown'
    const cashier = await Cashier.findOne({ username: 'alicebrown' }).populate('shop');
    
    if (cashier) {
      console.log('✅ Cashier found:', {
        id: cashier._id,
        username: cashier.username,
        fullName: cashier.fullName,
        isActive: cashier.isActive,
        role: cashier.role,
        shop: cashier.shop
      });
    } else {
      console.log('❌ Cashier not found');
    }
    
    // List all cashiers
    const allCashiers = await Cashier.find({}).select('username fullName isActive');
    console.log('📋 All cashiers:', allCashiers);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkCashier().catch(console.error);
