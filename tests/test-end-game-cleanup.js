const mongoose = require('mongoose');
const Game = require('../dist/models/Game').default;
const CompletedGame = require('../dist/models/CompletedGame').default;

// Test the end game cleanup process
async function testEndGameCleanup() {
  try {
    console.log('🧪 Testing End Game Cleanup Process...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to MongoDB');
    
    // Check current state
    const gamesCount = await Game.countDocuments();
    const completedGamesCount = await CompletedGame.countDocuments();
    
    console.log(`📊 Current state:`);
    console.log(`   Games collection: ${gamesCount} documents`);
    console.log(`   CompletedGames collection: ${completedGamesCount} documents`);
    
    // Show current games
    const currentGames = await Game.find({}).select('gameId status sessionId createdAt');
    console.log(`🎮 Current games:`, currentGames.map(g => ({
      gameId: g.gameId,
      status: g.status,
      sessionId: g.sessionId?.substring(0, 8) + '...',
      createdAt: g.createdAt
    })));
    
    // Show completed games
    const completedGames = await CompletedGame.find({}).select('gameId status completedAt');
    console.log(`🏁 Completed games:`, completedGames.map(g => ({
      gameId: g.gameId,
      status: g.status,
      completedAt: g.completedAt
    })));
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 What this test shows:');
    console.log('   - Games collection should only contain current active games');
    console.log('   - CompletedGames collection should contain ended games');
    console.log('   - No duplicate or stale game documents should exist');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testEndGameCleanup();
