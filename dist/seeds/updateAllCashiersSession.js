"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
const sessionUtils_1 = require("../utils/sessionUtils");
// Load environment variables
dotenv_1.default.config();
const updateAllCashiersSession = async () => {
    try {
        // Connect to database
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
        console.log('✅ Connected to MongoDB');
        // Find all cashiers
        const allCashiers = await Cashier_1.default.find({});
        console.log(`📋 Found ${allCashiers.length} total cashiers`);
        // Find cashiers that don't have a sessionId
        const cashiersToUpdate = allCashiers.filter(cashier => !cashier.sessionId);
        if (cashiersToUpdate.length === 0) {
            console.log('✅ All cashiers already have session IDs. No updates needed!');
            return;
        }
        console.log(`📋 Found ${cashiersToUpdate.length} cashiers to update...`);
        for (const cashier of cashiersToUpdate) {
            const sessionId = (0, sessionUtils_1.generateSessionId)();
            const displayUrl = (0, sessionUtils_1.generateDisplayUrl)(sessionId);
            cashier.sessionId = sessionId;
            cashier.displayUrl = displayUrl;
            cashier.isConnected = false;
            cashier.lastActivity = new Date();
            await cashier.save();
            console.log(`✅ Updated cashier: ${cashier.username} with Session ID: ${sessionId}`);
        }
        console.log('🎉 All cashiers updated successfully!');
    }
    catch (error) {
        console.error('❌ Error updating cashiers session data:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};
updateAllCashiersSession();
//# sourceMappingURL=updateAllCashiersSession.js.map