"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Game_1 = __importDefault(require("../models/Game"));
const gameIdService_1 = require("../services/gameIdService");
dotenv_1.default.config();
async function updateGamesToNewFormat() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
        console.log('Connected to MongoDB');
        // Get all games
        const games = await Game_1.default.find({});
        console.log(`Found ${games.length} games to update`);
        let updatedCount = 0;
        for (const game of games) {
            if (game.cashierId) {
                try {
                    // Get the current game ID for this cashier
                    const currentGameId = await gameIdService_1.GameIdService.getCurrentGameId(game.cashierId.toString());
                    // Update the game with the new game ID format
                    const uniqueSuffix = Math.random().toString(36).substr(2, 6);
                    await Game_1.default.findByIdAndUpdate(game._id, {
                        gameId: `GAME_${currentGameId}_${uniqueSuffix}`
                    });
                    console.log(`Updated game ${game._id} to GAME_${currentGameId}_${uniqueSuffix}`);
                    updatedCount++;
                }
                catch (error) {
                    console.error(`Error updating game ${game._id}:`, error);
                }
            }
            else {
                // For games without cashierId, use a default game ID
                const uniqueSuffix = Math.random().toString(36).substr(2, 6);
                await Game_1.default.findByIdAndUpdate(game._id, {
                    gameId: `GAME_4000_${uniqueSuffix}`
                });
                console.log(`Updated game ${game._id} to GAME_4000_${uniqueSuffix} (no cashier)`);
                updatedCount++;
            }
        }
        console.log(`\n✅ Updated ${updatedCount} games to new format`);
        // Show some examples
        const sampleGames = await Game_1.default.find({}).limit(5);
        console.log('\nSample updated games:');
        sampleGames.forEach(game => {
            console.log(`- ${game.gameId} (Cashier: ${game.cashierId})`);
        });
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error updating games:', error);
        process.exit(1);
    }
}
updateGamesToNewFormat();
//# sourceMappingURL=updateGamesToNewFormat.js.map