const mongoose = require('mongoose');

async function checkGames() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bingo2025');
    console.log('Connected to MongoDB');

    const Game = require('../dist/models/Game').default;
    const games = await Game.find({}).limit(5);
    
    console.log('Current games:');
    games.forEach(g => {
      console.log(`- ${g.gameId} (Cashier: ${g.cashierId})`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkGames();
