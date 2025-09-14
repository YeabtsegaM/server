import mongoose from 'mongoose';
import Cashier from '../models/Cashier';
import Game from '../models/Game';

/**
 * Fix session synchronization between cashier and display
 * This script updates the cashier's sessionId to match the display connection
 */
export async function fixSessionSync() {
  try {
    console.log('🔧 Starting session synchronization fix...');
    
    // Find the cashier with username 'yeab' (from the logs)
    const cashier = await Cashier.findOne({ username: 'yeab' }).exec();
    
    if (!cashier || !cashier._id) {
      console.log('❌ Cashier not found or invalid ID');
      return;
    }
    
    console.log('👤 Found cashier:', {
      id: cashier._id,
      username: cashier.username,
      currentSessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl
    });
    
    // The display is connected with this session ID (from logs)
    const displaySessionId = 'b45f5c4f-e47c-4aa8-93fd-bb8f14b312ef';
    
    // Update cashier with the correct session ID
    cashier.sessionId = displaySessionId;
    cashier.displayUrl = `${process.env.DISPLAY_BASE_URL || 'https://displayyebingocom.vercel.app?Bingo='}${displaySessionId}`;
    cashier.isConnected = true;
    cashier.lastActivity = new Date();
    
    await cashier.save();
    
    console.log('✅ Updated cashier session:', {
      id: cashier._id,
      username: cashier.username,
      newSessionId: cashier.sessionId,
      newDisplayUrl: cashier.displayUrl
    });
    
    // Now check if there's an existing game that needs to be updated
    const existingGame = await Game.findOne({ 
      cashierId: cashier._id?.toString() || '',
      gameId: 4002 
    });
    
    if (existingGame) {
      console.log('🎮 Found existing game:', {
        gameId: existingGame.gameId,
        currentSessionId: existingGame.sessionId,
        status: existingGame.status
      });
      
      // Update the game with the correct session ID
      existingGame.sessionId = displaySessionId;
      existingGame.displayToken = displaySessionId;
      existingGame.isConnected = true;
      existingGame.lastActivity = new Date();
      existingGame.connectionStatus = {
        ...existingGame.connectionStatus,
        cashierConnected: true,
        displayConnected: true,
        lastCashierActivity: new Date()
      };
      
      await existingGame.save();
      
      console.log('✅ Updated existing game:', {
        gameId: existingGame.gameId,
        newSessionId: existingGame.sessionId,
        status: existingGame.status
      });
    }
    
    console.log('🎉 Session synchronization completed successfully!');
    
    return {
      cashierUpdated: true,
      gameUpdated: !!existingGame,
      sessionId: displaySessionId
    };
    
  } catch (error) {
    console.error('❌ Error fixing session sync:', error);
    throw error;
  }
}
