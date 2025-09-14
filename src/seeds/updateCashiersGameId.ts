import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cashier from '../models/Cashier';

dotenv.config();

async function updateCashiersGameId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
    console.log('Connected to MongoDB');

    // Update all cashiers to have game ID tracking fields
    const result = await Cashier.updateMany(
      {
        $or: [
          { currentGameId: { $exists: false } },
          { lastGameDate: { $exists: false } }
        ]
      },
      {
        $set: {
          currentGameId: 4000,
          lastGameDate: null
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} cashiers with game ID tracking fields`);

    // Display all cashiers with their game ID info
    const cashiers = await Cashier.find({}).select('username currentGameId lastGameDate');
    console.log('\nCashiers with Game ID tracking:');
    cashiers.forEach(cashier => {
      console.log(`- ${cashier.username}: Game ID ${cashier.currentGameId}, Last Game Date: ${cashier.lastGameDate || 'None'}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating cashiers:', error);
    process.exit(1);
  }
}

updateCashiersGameId();
