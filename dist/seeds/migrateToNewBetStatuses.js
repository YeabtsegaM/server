"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
async function migrateBetStatuses() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo_system';
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        // Import Bet model
        const { default: Bet } = await Promise.resolve().then(() => __importStar(require('../models/Bet')));
        console.log('🔄 Starting bet status migration...');
        // Find all tickets with 'redeemed' status
        const redeemedTickets = await Bet.find({ betStatus: 'redeemed' });
        console.log(`📊 Found ${redeemedTickets.length} tickets with 'redeemed' status`);
        let wonCount = 0;
        let lostCount = 0;
        // Process each redeemed ticket
        for (const ticket of redeemedTickets) {
            if (ticket.win && ticket.win > 0) {
                // This was a winning ticket
                await Bet.findByIdAndUpdate(ticket._id, { betStatus: 'won_redeemed' });
                wonCount++;
                console.log(`✅ Updated ticket ${ticket.ticketNumber} to 'won_redeemed' (Prize: Br. ${ticket.win})`);
            }
            else {
                // This was a losing ticket
                await Bet.findByIdAndUpdate(ticket._id, { betStatus: 'lost_redeemed' });
                lostCount++;
                console.log(`✅ Updated ticket ${ticket.ticketNumber} to 'lost_redeemed' (No prize)`);
            }
        }
        console.log('\n🎉 Migration completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Total tickets processed: ${redeemedTickets.length}`);
        console.log(`   - Updated to 'won_redeemed': ${wonCount}`);
        console.log(`   - Updated to 'lost_redeemed': ${lostCount}`);
        // Verify the migration
        const remainingRedeemed = await Bet.find({ betStatus: 'redeemed' });
        if (remainingRedeemed.length === 0) {
            console.log('✅ Verification: No tickets with old redeemed status remain');
        }
        else {
            console.log(`⚠️ Warning: ${remainingRedeemed.length} tickets still have redeemed status`);
        }
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
    }
    finally {
        // Close connection
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}
// Run the migration
migrateBetStatuses();
//# sourceMappingURL=migrateToNewBetStatuses.js.map