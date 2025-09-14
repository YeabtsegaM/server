"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025';
async function addWinFieldToBets() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');
        // Get the Bet model
        const Bet = mongoose_1.default.model('Bet', new mongoose_1.default.Schema({}));
        console.log('🔍 Finding all existing bets...');
        const existingBets = await Bet.find({});
        console.log(`📊 Found ${existingBets.length} existing bets`);
        if (existingBets.length === 0) {
            console.log('ℹ️ No existing bets found. Migration not needed.');
            return;
        }
        console.log('🔄 Updating existing bets to add win field...');
        // Update all existing bets to add the win field
        // For bets that are already redeemed, we'll need to calculate the win amount
        // For now, we'll set all to 0 and they can be updated when redeemed
        const updateResult = await Bet.updateMany({ win: { $exists: false } }, // Only update bets that don't have the win field
        { $set: { win: 0 } });
        console.log(`✅ Successfully updated ${updateResult.modifiedCount} bets`);
        console.log(`📝 Matched ${updateResult.matchedCount} bets`);
        // Verify the update
        const betsWithoutWin = await Bet.find({ win: { $exists: false } });
        console.log(`🔍 Bets without win field after update: ${betsWithoutWin.length}`);
        if (betsWithoutWin.length === 0) {
            console.log('🎉 All bets now have the win field!');
        }
        else {
            console.log('⚠️ Some bets still missing win field');
        }
        console.log('✅ Migration completed successfully');
    }
    catch (error) {
        console.error('❌ Error during migration:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}
// Run the migration
addWinFieldToBets().catch(console.error);
//# sourceMappingURL=addWinFieldToBets.js.map