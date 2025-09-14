/**
 * Database Migration Script: 6-digit to 4-digit Game IDs
 * 
 * This script will:
 * 1. Clean all existing games with old 6-digit IDs
 * 2. Reset all cashier game IDs to 4000
 * 3. Update database schema for new 4-digit system
 * 4. Ensure database is ready for new game ID system
 * 
 * RUN THIS SCRIPT BEFORE STARTING THE NEW SYSTEM!
 */

import mongoose from 'mongoose';
import Cashier from '../models/Cashier';
import Game from '../models/Game';
import CompletedGame from '../models/CompletedGame';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025';

async function migrateTo4DigitGameIds() {
  try {
    console.log('🚀 Starting migration to 4-digit Game ID system...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Clean all existing games with old 6-digit IDs
    console.log('🧹 Cleaning old 6-digit game IDs...');
    
    const oldGames = await Game.find({
      gameId: { $regex: /^[0-9]{6,}$/ } // Find games with 6+ digit IDs
    });
    
    console.log(`📊 Found ${oldGames.length} games with old 6-digit IDs`);
    
    if (oldGames.length > 0) {
      // Archive these games to CompletedGame collection
      for (const game of oldGames) {
        try {
          const gameToArchive = {
            gameId: game.gameId,
            cashierId: game.cashierId,
            sessionId: game.sessionId,
            status: 'migrated',
            gameData: game.gameData || {},
            connectionStatus: game.connectionStatus,
            createdAt: game.createdAt,
            completedAt: new Date(),
            migrationNote: 'Migrated from 6-digit to 4-digit system'
          };
          
          await CompletedGame.create(gameToArchive);
          console.log(`📦 Archived old game: ${game.gameId}`);
        } catch (error) {
          console.error(`❌ Error archiving game ${game.gameId}:`, error);
        }
      }
      
      // Delete old games
      await Game.deleteMany({
        gameId: { $regex: /^[0-9]{6,}$/ }
      });
      console.log('🗑️ Deleted all old 6-digit games');
    }
    
    // Step 2: Reset all cashier game IDs to 4000
    console.log('🔄 Resetting all cashier game IDs to 4000...');
    
    const cashiers = await Cashier.find({});
    let updatedCashiers = 0;
    
    for (const cashier of cashiers) {
      try {
        cashier.currentGameId = 4000;
        cashier.lastGameDate = undefined; // Reset date to trigger new day logic
        await cashier.save();
        updatedCashiers++;
        console.log(`✅ Reset cashier ${cashier.username}: Game ID → 4000`);
      } catch (error) {
        console.error(`❌ Error resetting cashier ${cashier.username}:`, error);
      }
    }
    
    console.log(`✅ Updated ${updatedCashiers} cashiers`);
    
    // Step 3: Clean any remaining invalid game IDs
    console.log('🧹 Cleaning any remaining invalid game IDs...');
    
    const invalidGames = await Game.find({
      $or: [
        { gameId: { $regex: /^[0-9]{6,}$/ } }, // 6+ digits
        { gameId: { $regex: /^[0-9]{1,3}$/ } }, // 1-3 digits (too small)
        { gameId: { $regex: /^[5-9][0-9]{3}$/ } } // 5000-9999 (too large)
      ]
    });
    
    if (invalidGames.length > 0) {
      console.log(`📊 Found ${invalidGames.length} games with invalid game IDs`);
      
      // Archive invalid games
      for (const game of invalidGames) {
        try {
          const gameToArchive = {
            gameId: game.gameId,
            cashierId: game.cashierId,
            sessionId: game.sessionId,
            status: 'invalid_migrated',
            gameData: game.gameData || {},
            connectionStatus: game.connectionStatus,
            createdAt: game.createdAt,
            completedAt: new Date(),
            migrationNote: 'Invalid game ID - migrated to 4-digit system'
          };
          
          await CompletedGame.create(gameToArchive);
          console.log(`📦 Archived invalid game: ${game.gameId}`);
        } catch (error) {
          console.error(`❌ Error archiving invalid game ${game.gameId}:`, error);
        }
      }
      
      // Delete invalid games
      await Game.deleteMany({
        $or: [
          { gameId: { $regex: /^[0-9]{6,}$/ } },
          { gameId: { $regex: /^[0-9]{1,3}$/ } },
          { gameId: { $regex: /^[5-9][0-9]{3}$/ } }
        ]
      });
      console.log('🗑️ Deleted all invalid games');
    }
    
    // Step 4: Verify database is clean
    console.log('🔍 Verifying database is clean...');
    
    const remainingGames = await Game.find({});
    const validGames = remainingGames.filter(game => {
      const gameId = parseInt(game.gameId, 10);
      return !isNaN(gameId) && gameId >= 4000 && gameId <= 4999;
    });
    
    console.log(`📊 Remaining games: ${remainingGames.length}`);
    console.log(`✅ Valid 4-digit games: ${validGames.length}`);
    
    if (remainingGames.length !== validGames.length) {
      console.warn('⚠️ Some games still have invalid IDs - manual cleanup may be needed');
    }
    
    // Step 5: Create sample game with valid 4-digit ID for testing
    console.log('🧪 Creating sample game with valid 4-digit ID...');
    
    try {
      const sampleGame = new Game({
        gameId: '4000',
        cashierId: null,
        sessionId: 'sample-migration-test',
        displayToken: 'migration-test-token',
        status: 'waiting',
        isConnected: false,
        connectedAt: new Date(),
        lastActivity: new Date(),
        gameData: {
          calledNumbers: [],
          progress: 0,
          cartelas: 0,
          totalStack: 0,
          totalWinStack: 0,
          totalShopMargin: 0,
          totalSystemFee: 0,
          netPrizePool: 0,

          selectedCartelas: [],
          placedBetCartelas: [],
          winPatterns: [],
          drawHistory: []
        },
        connectionStatus: {
          cashierConnected: false,
          displayConnected: false
        }
      });
      
      await sampleGame.save();
      console.log('✅ Created sample game with ID: 4000');
      
      // Clean up sample game
      await Game.deleteOne({ sessionId: 'sample-migration-test' });
      console.log('🧹 Cleaned up sample game');
      
    } catch (error) {
      console.error('❌ Error creating sample game:', error);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Cleaned ${oldGames.length} old 6-digit games`);
    console.log(`   - Updated ${updatedCashiers} cashiers to Game ID 4000`);
    console.log(`   - Cleaned ${invalidGames.length} invalid games`);
    console.log(`   - Database ready for new 4-digit system (4000-4999)`);
    console.log('');
    console.log('🚀 You can now start the server with the new 4-digit Game ID system!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateTo4DigitGameIds()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateTo4DigitGameIds;
