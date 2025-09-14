import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from '../models/Game';
import Cashier from '../models/Cashier';
import { GameIdService } from '../services/gameIdService';

dotenv.config();

async function updateGamesToNewFormat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('Connected to MongoDB');

    // Get all games
    const games = await Game.find({});
    console.log(`Found ${games.length} games to update`);

    let updatedCount = 0;

    for (const game of games) {
      if (game.cashierId) {
        try {
          // Get the current game ID for this cashier
          const currentGameId = await GameIdService.getCurrentGameId(game.cashierId.toString());
          
          // Update the game with the new game ID format
          const uniqueSuffix = Math.random().toString(36).substr(2, 6);
          await Game.findByIdAndUpdate(game._id, {
            gameId: `GAME_${currentGameId}_${uniqueSuffix}`
          });

          console.log(`Updated game ${game._id} to GAME_${currentGameId}_${uniqueSuffix}`);
          updatedCount++;
        } catch (error) {
          console.error(`Error updating game ${game._id}:`, error);
        }
      } else {
        // For games without cashierId, use a default game ID
        const uniqueSuffix = Math.random().toString(36).substr(2, 6);
        await Game.findByIdAndUpdate(game._id, {
          gameId: `GAME_4000_${uniqueSuffix}`
        });
        console.log(`Updated game ${game._id} to GAME_4000_${uniqueSuffix} (no cashier)`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} games to new format`);

    // Show some examples
    const sampleGames = await Game.find({}).limit(5);
    console.log('\nSample updated games:');
    sampleGames.forEach(game => {
      console.log(`- ${game.gameId} (Cashier: ${game.cashierId})`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating games:', error);
    process.exit(1);
  }
}

updateGamesToNewFormat();
