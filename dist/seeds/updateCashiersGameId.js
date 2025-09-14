"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
dotenv_1.default.config();
async function updateCashiersGameId() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
        console.log('Connected to MongoDB');
        // Update all cashiers to have game ID tracking fields
        const result = await Cashier_1.default.updateMany({
            $or: [
                { currentGameId: { $exists: false } },
                { lastGameDate: { $exists: false } }
            ]
        }, {
            $set: {
                currentGameId: 4000,
                lastGameDate: null
            }
        });
        console.log(`Updated ${result.modifiedCount} cashiers with game ID tracking fields`);
        // Display all cashiers with their game ID info
        const cashiers = await Cashier_1.default.find({}).select('username currentGameId lastGameDate');
        console.log('\nCashiers with Game ID tracking:');
        cashiers.forEach(cashier => {
            console.log(`- ${cashier.username}: Game ID ${cashier.currentGameId}, Last Game Date: ${cashier.lastGameDate || 'None'}`);
        });
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error updating cashiers:', error);
        process.exit(1);
    }
}
updateCashiersGameId();
//# sourceMappingURL=updateCashiersGameId.js.map