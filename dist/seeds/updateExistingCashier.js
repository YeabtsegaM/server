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
const updateExistingCashier = async () => {
    try {
        // Connect to database
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
        console.log('✅ Connected to MongoDB');
        // Find the existing cashier
        const cashier = await Cashier_1.default.findOne({ username: 'alicebrown' });
        if (!cashier) {
            console.log('❌ Cashier alicebrown not found');
            return;
        }
        console.log('📋 Found cashier:', {
            id: cashier._id,
            username: cashier.username,
            fullName: cashier.fullName,
            sessionId: cashier.sessionId || 'Not set'
        });
        // Generate session data
        const sessionId = (0, sessionUtils_1.generateSessionId)();
        const displayUrl = (0, sessionUtils_1.generateDisplayUrl)(sessionId);
        // Update cashier with session data
        cashier.sessionId = sessionId;
        cashier.displayUrl = displayUrl;
        cashier.isConnected = false;
        cashier.lastActivity = new Date();
        await cashier.save();
        console.log('✅ Session data updated for alicebrown:');
        console.log('Session ID:', sessionId);
        console.log('Display URL:', displayUrl);
        // Disconnect from database
        await mongoose_1.default.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
    catch (error) {
        console.error('❌ Error updating cashier:', error);
        process.exit(1);
    }
};
// Run the script
updateExistingCashier();
//# sourceMappingURL=updateExistingCashier.js.map