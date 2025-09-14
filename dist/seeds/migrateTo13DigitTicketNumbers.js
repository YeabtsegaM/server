"use strict";
// import mongoose from 'mongoose';
// import { config } from 'dotenv';
// // Load environment variables
// config();
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025';
// async function migrateTo13DigitTicketNumbers() {
//   try {
//     console.log('🔌 Connecting to MongoDB...');
//     await mongoose.connect(MONGODB_URI);
//     console.log('✅ Connected to MongoDB successfully');
//     // Get the Bet model
//     const Bet = mongoose.model('Bet', new mongoose.Schema({}));
//     console.log('🔍 Finding all existing bets...');
//     const existingBets = await Bet.find({});
//     console.log(`📊 Found ${existingBets.length} existing bets`);
//     if (existingBets.length === 0) {
//       console.log('ℹ️ No existing bets found. Migration not needed.');
//       return;
//     }
//     console.log('🔄 Updating existing bets to 13-digit ticket numbers...');
//     let updatedCount = 0;
//     let skippedCount = 0;
//     for (const bet of existingBets) {
//       const currentTicketNumber = bet.ticketNumber;
//       // Check if it's already 13 digits
//       if (currentTicketNumber.length === 13) {
//         skippedCount++;
//         continue;
//       }
//       // Check if it's 10 digits (the expected format before migration)
//       if (currentTicketNumber.length === 10) {
//         // Pad with 3 zeros at the beginning to make it 13 digits
//         const newTicketNumber = `000${currentTicketNumber}`;
//         // Check if the new ticket number already exists
//         const existingBet = await Bet.findOne({ ticketNumber: newTicketNumber });
//         if (existingBet) {
//           console.log(`⚠️ Ticket number ${newTicketNumber} already exists, skipping ${currentTicketNumber}`);
//           skippedCount++;
//           continue;
//         }
//         // Update the bet with the new 13-digit ticket number
//         await Bet.updateOne(
//           { _id: bet._id },
//           { $set: { ticketNumber: newTicketNumber } }
//         );
//         console.log(`✅ Updated: ${currentTicketNumber} → ${newTicketNumber}`);
//         updatedCount++;
//       } else {
//         console.log(`⚠️ Skipping ticket number ${currentTicketNumber} (unexpected length: ${currentTicketNumber.length})`);
//         skippedCount++;
//       }
//     }
//     console.log(`✅ Migration completed successfully!`);
//     console.log(`📊 Summary:`);
//     console.log(`   - Updated: ${updatedCount} bets`);
//     console.log(`   - Skipped: ${skippedCount} bets`);
//     console.log(`   - Total processed: ${existingBets.length} bets`);
//     // Verify the migration
//     const betsWith10Digits = await Bet.find({ 
//       ticketNumber: { $regex: /^\d{10}$/ } 
//     });
//     const betsWith13Digits = await Bet.find({ 
//       ticketNumber: { $regex: /^\d{13}$/ } 
//     });
//     console.log(`🔍 Verification:`);
//     console.log(`   - Bets with 10 digits: ${betsWith10Digits.length}`);
//     console.log(`   - Bets with 13 digits: ${betsWith13Digits.length}`);
//     if (betsWith10Digits.length === 0 && betsWith13Digits.length > 0) {
//       console.log('🎉 All ticket numbers are now 13 digits!');
//     } else {
//       console.log('⚠️ Some ticket numbers may still need attention');
//     }
//   } catch (error) {
//     console.error('❌ Error during migration:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('🔌 Disconnected from MongoDB');
//   }
// }
// // Run the migration
// migrateTo13DigitTicketNumbers().catch(console.error);
//# sourceMappingURL=migrateTo13DigitTicketNumbers.js.map