const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Cashier = require('../src/models/Cashier');
const Game = require('../src/models/Game');

async function testGameIdSystem() {
  try {
    console.log('🧪 Testing Game ID System...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Check cashier game IDs
    console.log('\n📋 Test 1: Checking cashier game IDs...');
    const cashiers = await Cashier.find({});
    console.log(`Found ${cashiers.length} cashiers`);
    
    for (const cashier of cashiers) {
      const gameId = cashier.currentGameId;
      const isValid = gameId >= 100000 && gameId <= 999999;
      console.log(`  ${cashier.username}: Game ID ${gameId} - ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!isValid) {
        console.log(`    🔧 Fixing invalid game ID...`);
        cashier.currentGameId = 100000;
        await cashier.save();
        console.log(`    ✅ Fixed to 100000`);
      }
    }
    
    // Test 2: Check game game IDs
    console.log('\n🎮 Test 2: Checking game game IDs...');
    const games = await Game.find({});
    console.log(`Found ${games.length} games`);
    
    let invalidGames = 0;
    for (const game of games) {
      const gameId = game.gameId;
      let isValid = false;
      
      if (typeof gameId === 'string') {
        if (gameId.startsWith('GAME_')) {
          // Check GAME_ format
          const parts = gameId.split('_');
          if (parts.length === 3) {
            const gameNumber = parseInt(parts[1], 10);
            isValid = !isNaN(gameNumber) && gameNumber >= 100000 && gameNumber <= 999999;
          }
        } else {
          // Check direct 6-digit format
          const gameNumber = parseInt(gameId, 10);
          isValid = !isNaN(gameNumber) && gameNumber >= 100000 && gameNumber <= 999999;
        }
      }
      
      if (!isValid) {
        invalidGames++;
        console.log(`  ❌ Invalid game ID: ${gameId} (Game: ${game._id})`);
      }
    }
    
    if (invalidGames === 0) {
      console.log('  ✅ All game IDs are valid');
    } else {
      console.log(`  ⚠️ Found ${invalidGames} invalid game IDs`);
    }
    
    // Test 3: Test game ID generation
    console.log('\n🔢 Test 3: Testing game ID generation...');
    
    // Get first cashier for testing
    const testCashier = cashiers[0];
    if (testCashier) {
      console.log(`Testing with cashier: ${testCashier.username}`);
      console.log(`Current game ID: ${testCashier.currentGameId}`);
      
      // Test incrementing
      const nextGameId = testCashier.currentGameId + 1;
      if (nextGameId > 999999) {
        console.log('  ⚠️ Game ID would exceed maximum, should reset to 100000');
      } else {
        console.log(`  Next game ID would be: ${nextGameId}`);
      }
      
      // Test 6-digit format
      const gameIdStr = testCashier.currentGameId.toString();
      const is6Digits = /^\d{6}$/.test(gameIdStr);
      console.log(`  Game ID format: ${gameIdStr} - ${is6Digits ? '✅ 6 digits' : '❌ Not 6 digits'}`);
    }
    
    console.log('\n✅ Game ID System test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testGameIdSystem();
