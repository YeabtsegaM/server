import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateBetStatuses() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Import Bet model
    const { default: Bet } = await import('../models/Bet');

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
      } else {
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
    } else {
      console.log(`⚠️ Warning: ${remainingRedeemed.length} tickets still have redeemed status`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
migrateBetStatuses();
