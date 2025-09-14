"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixGameIds = main;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
const Game_1 = __importDefault(require("../models/Game"));
// Load environment variables
dotenv_1.default.config();
/**
 * Migration script to fix existing game IDs and ensure data integrity
 *
 * This script:
 * 1. Fixes any cashier game IDs that are 0 or below 100000
 * 2. Ensures all game IDs follow the proper format
 * 3. Validates database constraints
 * 4. Reports any data inconsistencies
 */
const MIN_GAME_ID = 100000;
const MAX_GAME_ID = 999999;
async function connectDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    }
    catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}
async function fixCashierGameIds() {
    console.log('🔧 Fixing cashier game IDs...');
    try {
        const cashiers = await Cashier_1.default.find({});
        let fixedCount = 0;
        let totalCashiers = cashiers.length;
        for (const cashier of cashiers) {
            try {
                const originalGameId = cashier.currentGameId;
                let needsUpdate = false;
                // Check if game ID is invalid
                if (!originalGameId || originalGameId < MIN_GAME_ID || originalGameId > MAX_GAME_ID) {
                    cashier.currentGameId = MIN_GAME_ID;
                    needsUpdate = true;
                    console.log(`  🔧 Fixed cashier ${cashier.username}: Game ID ${originalGameId} → ${MIN_GAME_ID}`);
                }
                // Check if lastGameDate is invalid
                if (cashier.lastGameDate && !(cashier.lastGameDate instanceof Date)) {
                    cashier.lastGameDate = undefined;
                    needsUpdate = true;
                    console.log(`  🔧 Fixed cashier ${cashier.username}: Invalid lastGameDate`);
                }
                if (needsUpdate) {
                    await cashier.save();
                    fixedCount++;
                }
            }
            catch (error) {
                console.error(`  ❌ Error fixing cashier ${cashier.username}:`, error);
            }
        }
        console.log(`✅ Fixed ${fixedCount} out of ${totalCashiers} cashiers`);
        return fixedCount;
    }
    catch (error) {
        console.error('❌ Error fixing cashier game IDs:', error);
        return 0;
    }
}
async function fixGameGameIds() {
    console.log('🔧 Fixing game game IDs...');
    try {
        const games = await Game_1.default.find({});
        let fixedCount = 0;
        let totalGames = games.length;
        for (const game of games) {
            try {
                const originalGameId = game.gameId;
                let needsUpdate = false;
                let newGameId = originalGameId;
                // Check if game ID is a valid 6-digit number
                if (typeof originalGameId === 'string') {
                    const gameNumber = parseInt(originalGameId, 10);
                    if (!isNaN(gameNumber) && gameNumber >= MIN_GAME_ID && gameNumber <= MAX_GAME_ID) {
                        // Valid 6-digit number, keep as is
                        continue;
                    }
                    else if (originalGameId.startsWith('GAME_')) {
                        // Check GAME_ format
                        const parts = originalGameId.split('_');
                        if (parts.length === 3) {
                            const gameNumber = parseInt(parts[1], 10);
                            if (!isNaN(gameNumber) && gameNumber >= MIN_GAME_ID && gameNumber <= MAX_GAME_ID) {
                                // Valid GAME_ format, keep as is
                                continue;
                            }
                        }
                    }
                    // Invalid format, generate new game ID
                    const randomSuffix = Math.random().toString(36).substr(2, 6);
                    newGameId = `GAME_${MIN_GAME_ID}_${randomSuffix}`;
                    needsUpdate = true;
                    console.log(`  🔧 Fixed game ${game._id}: Game ID ${originalGameId} → ${newGameId}`);
                }
                else {
                    // Invalid type, convert to string
                    newGameId = `GAME_${MIN_GAME_ID}_${Math.random().toString(36).substr(2, 6)}`;
                    needsUpdate = true;
                    console.log(`  🔧 Fixed game ${game._id}: Invalid game ID type → ${newGameId}`);
                }
                if (needsUpdate) {
                    game.gameId = newGameId;
                    await game.save();
                    fixedCount++;
                }
            }
            catch (error) {
                console.error(`  ❌ Error fixing game ${game._id}:`, error);
            }
        }
        console.log(`✅ Fixed ${fixedCount} out of ${totalGames} games`);
        return fixedCount;
    }
    catch (error) {
        console.error('❌ Error fixing game game IDs:', error);
        return 0;
    }
}
async function validateDatabaseConstraints() {
    console.log('🔍 Validating database constraints...');
    try {
        // Check for duplicate game IDs
        const duplicateGameIds = await Game_1.default.aggregate([
            {
                $group: {
                    _id: '$gameId',
                    count: { $sum: 1 },
                    games: { $push: '$_id' }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        if (duplicateGameIds.length > 0) {
            console.log('⚠️ Found duplicate game IDs:');
            duplicateGameIds.forEach(dup => {
                console.log(`  Game ID: ${dup._id}, Count: ${dup.count}, Games: ${dup.games.join(', ')}`);
            });
        }
        else {
            console.log('✅ No duplicate game IDs found');
        }
        // Check for invalid cashier game IDs
        const invalidCashiers = await Cashier_1.default.find({
            $or: [
                { currentGameId: { $lt: MIN_GAME_ID } },
                { currentGameId: { $gt: MAX_GAME_ID } },
                { currentGameId: null }
            ]
        });
        if (invalidCashiers.length > 0) {
            console.log(`⚠️ Found ${invalidCashiers.length} cashiers with invalid game IDs`);
            invalidCashiers.forEach(cashier => {
                console.log(`  Cashier: ${cashier.username}, Game ID: ${cashier.currentGameId}`);
            });
        }
        else {
            console.log('✅ All cashiers have valid game IDs');
        }
    }
    catch (error) {
        console.error('❌ Error validating database constraints:', error);
    }
}
async function createDatabaseIndexes() {
    console.log('🔧 Creating database indexes...');
    try {
        // Ensure indexes exist
        await Cashier_1.default.syncIndexes();
        await Game_1.default.syncIndexes();
        console.log('✅ Database indexes created/updated');
    }
    catch (error) {
        console.error('❌ Error creating database indexes:', error);
    }
}
async function main() {
    console.log('🚀 Starting Game ID migration...');
    try {
        await connectDatabase();
        // Fix existing data
        const fixedCashiers = await fixCashierGameIds();
        const fixedGames = await fixGameGameIds();
        // Create/update indexes
        await createDatabaseIndexes();
        // Validate constraints
        await validateDatabaseConstraints();
        console.log('\n📊 Migration Summary:');
        console.log(`  Cashiers fixed: ${fixedCashiers}`);
        console.log(`  Games fixed: ${fixedGames}`);
        console.log('✅ Migration completed successfully');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}
// Run migration if called directly
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=fixGameIds.js.map