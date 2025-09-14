const mongoose = require('mongoose');
const Game = require('../dist/models/Game').default;
const CompletedGame = require('../dist/models/CompletedGame').default;

// Clean up duplicate games and keep only the most recent one
async function cleanupDuplicateGames() {
  try {
    console.log('🧹 Cleaning up duplicate games...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bingo2025');
    console.log('✅ Connected to MongoDB');
    
    // Check current state
    const gamesCount = await Game.countDocuments();
    const completedGamesCount = await CompletedGame.countDocuments();
    
    console.log(`📊 Before cleanup:`);
    console.log(`   Games collection: ${gamesCount} documents`);
    console.log(`   CompletedGames collection: ${completedGamesCount} documents`);
    
    if (gamesCount <= 1) {
      console.log('✅ No cleanup needed - only 1 game exists');
      return;
    }
    
    // Get all games sorted by creation date (newest first)
    const allGames = await Game.find({}).sort({ createdAt: -1 });
    console.log(`\n🎮 Found ${allGames.length} games:`);
    allGames.forEach(game => {
      console.log(`   - Game ${game.gameId}: ${game.status} (created: ${game.createdAt})`);
    });
    
    // Keep only the most recent game
    const gameToKeep = allGames[0];
    const gamesToDelete = allGames.slice(1);
    
    console.log(`\n🔒 Keeping game: ${gameToKeep.gameId}`);
    console.log(`🗑️ Deleting ${gamesToDelete.length} duplicate games:`);
    
    // Delete all duplicate games
    for (const game of gamesToDelete) {
      console.log(`   - Deleting Game ${game.gameId}...`);
      await Game.findByIdAndDelete(game._id);
    }
    
    // Verify cleanup
    const finalGamesCount = await Game.countDocuments();
    console.log(`\n✅ Cleanup completed!`);
    console.log(`   Games collection: ${finalGamesCount} document(s)`);
    console.log(`   CompletedGames collection: ${completedGamesCount} document(s)`);
    
    // Show final state
    const remainingGames = await Game.find({});
    console.log(`\n🎮 Remaining games:`);
    remainingGames.forEach(game => {
      console.log(`   - Game ${game.gameId}: ${game.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupDuplicateGames();
