import { Request, Response } from 'express';
import { Bet, IBet } from '../models/Bet';
import { Cartela } from '../models/Cartela';
import Shop, { IShop } from '../models/Shop';
import Cashier from '../models/Cashier';
import Game from '../models/Game';
import { ResponseService } from '../services/responseService';
import { GameIdService } from '../services/gameIdService';
import { generateGameId } from '../utils/gameIdUtils';
import { printerService, BingoTicketData } from '../utils/printerService';

interface BetRequest extends Request {
  cashier?: {
    id: string;
    username: string;
    role: string;
    shopId: string;
  };
}

// Generate next ticket number for a cashier - THREAD SAFE VERSION
async function generateTicketNumber(cashierId: string): Promise<string> {
  try {
    // Use a more robust approach to prevent duplicate ticket numbers
    // Get the highest ticket number for this cashier
    const lastBet = await Bet.findOne({ cashierId }).sort({ ticketNumber: -1 });
    
    let nextNumber = 1;
    if (lastBet && lastBet.ticketNumber) {
      const lastNumber = parseInt(lastBet.ticketNumber, 10);
      if (!isNaN(lastNumber)) {
        // If we're at 9999999999999, reset to 1
        if (lastNumber >= 9999999999999) {
          nextNumber = 1;
        } else {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    // Generate a unique ticket number with exactly 13 digits
    // Always start with 0000000000001 and increment
    const uniqueTicketNumber = nextNumber.toString().padStart(13, '0');
    
    // Verify this ticket number doesn't exist (double-check)
    const existingBet = await Bet.findOne({ ticketNumber: uniqueTicketNumber });
    if (existingBet) {
      // If duplicate, increment and try again
      nextNumber++;
      const fallbackTicketNumber = nextNumber.toString().padStart(13, '0');
      return fallbackTicketNumber;
    }
    
    return uniqueTicketNumber;
  } catch (error) {
    console.error('Error generating ticket number:', error);
    // Fallback: start with 0000000000001
    return '0000000000001';
  }
}

// Generate multiple unique ticket numbers for batch bet placement
async function generateMultipleTicketNumbers(cashierId: string, count: number): Promise<string[]> {
  try {
    const ticketNumbers: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const ticketNumber = await generateTicketNumber(cashierId);
      ticketNumbers.push(ticketNumber);
      
      // Small delay to ensure uniqueness
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return ticketNumbers;
  } catch (error) {
    console.error('Error generating multiple ticket numbers:', error);
    // Fallback: generate sequential 13-digit numbers starting from 0000000000001
    return Array.from({ length: count }, (_, i) => 
      (i + 1).toString().padStart(13, '0')
    );
  }
}

// Calculate BINGO bet amounts
function calculateBetAmounts(totalStake: number, shopMargin: number, systemFee: number) {
  try {
    // Ensure all values are valid numbers
    const stake = Number(totalStake) || 0;
    const margin = Number(shopMargin) || 0;
    const fee = Number(systemFee) || 0;
    
    // Calculate amounts with proper error handling
    // System fee is deducted FROM shop margin, not from total stake
    const systemFeeAmount = stake * (fee / 100);
    const netShopMargin = margin - fee; // Shop gets margin minus system fee
    const totalWinStack = stake - (stake * (netShopMargin / 100)); // Prize pool after shop margin (which already excludes system fee)
    
    return {
      totalWinStack: Math.max(0, totalWinStack),
      systemFeeAmount: Math.max(0, systemFeeAmount),
      netShopMargin: Math.max(0, netShopMargin)
    };
  } catch (error) {
    console.error('Error calculating bet amounts:', error);
    return {
      totalWinStack: totalStake,
      systemFeeAmount: 0,
      netShopMargin: 0
    };
  }
}

// Place a new bet
export const placeBet = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const { cartelaIds, stake } = req.body; // Changed from cartelaId to cartelaIds array
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!cartelaIds || !Array.isArray(cartelaIds) || cartelaIds.length === 0 || !stake) {
      ResponseService.validationError(res, 'Cartela IDs array and stake are required');
      return;
    }

    if (stake < 5 || stake > 1000) {
      ResponseService.validationError(res, 'Stake must be between Br. 5 and Br. 1000');
      return;
    }

    // Get cashier and shop information
    const cashier = await Cashier.findById(cashierId).populate('shop');
    if (!cashier) {
      ResponseService.notFound(res, 'Cashier not found');
      return;
    }

         const shop = await Shop.findById(cashier.shop) as IShop | null;
     if (!shop) {
       ResponseService.notFound(res, 'Shop not found');
       return;
     }
     
     // Log shop configuration details
     console.log(`🏪 Shop Configuration for ${shop.shopName || shop._id}:`);
     console.log(`   - Shop ID: ${shop._id}`);
     console.log(`   - Shop Name: ${shop.shopName || 'N/A'}`);
     console.log(`   - Shop Margin: ${shop.margin}%`);
     console.log(`   - Cashier ID: ${cashierId}`);

     // Ensure shop has required fields - NO defaults, only exact values
     if (typeof shop.margin !== 'number') {
       ResponseService.serverError(res, 'Shop configuration is incomplete. Please contact admin to set margin.');
       return;
     }

    // Get current game - only allow bets when game is in waiting status
    let currentGame = await Game.findOne({ 
      cashierId, 
      status: 'waiting' 
    }).sort({ lastActivity: -1 }); // Get the most recently active game

    if (!currentGame) {
      ResponseService.notFound(res, 'No waiting game found. Bets can only be placed before the game starts.');
      return;
    }

    // Ensure we're using the correct current game ID from the GameIdService
    const currentGameId = await GameIdService.getCurrentGameId(cashierId);
    const expectedGameId = generateGameId(currentGameId);
    
    // Log for debugging
    console.log(`🎮 Placing bet - Current game ID: ${currentGame.gameId}, Expected: ${expectedGameId}`);
    
    // Verify that the current game matches the expected game ID
    if (currentGame.gameId !== expectedGameId) {
      console.log(`⚠️ Game ID mismatch - Current: ${currentGame.gameId}, Expected: ${expectedGameId}`);
      // Try to find the correct current game
      const correctGame = await Game.findOne({ 
        cashierId, 
        gameId: expectedGameId,
        status: 'waiting' 
      });
      
      if (correctGame) {
        console.log(`✅ Found correct game with ID: ${correctGame.gameId}`);
        currentGame = correctGame;
      } else {
        ResponseService.notFound(res, 'Game ID mismatch. Please refresh and try again.');
        return;
      }
    }
    
    // Use the current game ID from the database
    const gameIdToUse = currentGame.gameId;

    // Validate all cartelas exist and are active
    const cartelas = await Cartela.find({ 
      cartelaId: { $in: cartelaIds }, 
      cashierId, 
      isActive: true 
    });

    if (cartelas.length !== cartelaIds.length) {
      const foundIds = cartelas.map(c => c.cartelaId);
      const missingIds = cartelaIds.filter(id => !foundIds.includes(id));
      ResponseService.notFound(res, `Some cartelas not found or inactive: ${missingIds.join(', ')}`);
      return;
    }

    // Check if any cartelas already have placed bets in the current game
    if (currentGame.gameData?.placedBetCartelas) {
      const alreadyPlacedCartelas = cartelaIds.filter(id => 
        currentGame.gameData!.placedBetCartelas.includes(id)
      );
      
      if (alreadyPlacedCartelas.length > 0) {
        ResponseService.validationError(res, `Cannot place bets on cartelas that already have bets in the current game: ${alreadyPlacedCartelas.join(', ')}`);
        return;
      }
    }

    // Additional validation: Check if any cartelas have bets in the database for this specific game
    const existingBetsForGame = await Bet.find({
      gameId: gameIdToUse,
      cartelaId: { $in: cartelaIds }
    });

    if (existingBetsForGame.length > 0) {
      const cartelasWithBets = existingBetsForGame.map(bet => bet.cartelaId);
      ResponseService.validationError(res, `Some cartelas already have bets in the current game: ${cartelasWithBets.join(', ')}`);
      return;
    }

         // Calculate bet amounts
     const totalStake = stake * cartelaIds.length; // Total stake for all cartelas
     
     console.log(`💰 Financial Calculation Details:`);
     console.log(`   - Total Stake: Br. ${totalStake} (${stake} × ${cartelaIds.length} cartelas)`);
     console.log(`   - Shop Margin: ${shop.margin}%`);
     
     // Calculate according to your concept: Winner gets total - shop margin, Shop gets margin - system fee
     const shopMarginAmount = (totalStake * shop.margin) / 100; // Full shop margin amount
     const winnerPrizePool = totalStake - shopMarginAmount; // Winner gets total - shop margin
     
     // Place individual bets for each cartela
    const bets = [];
    const ticketNumbers = await generateMultipleTicketNumbers(cashierId, cartelaIds.length);

    for (let i = 0; i < cartelaIds.length; i++) {
      const cartelaId = cartelaIds[i];
      const ticketNumber = ticketNumbers[i];
      
      try {
        
                 // Create the bet for this cartela
         const bet = new Bet({
           ticketNumber: ticketNumber, // Use the generated ticket number
           betId: `${ticketNumber}-${cartelaId}-${Date.now()}`, // Generate unique bet ID
           cartelaId,
           stake,
           gameId: gameIdToUse,
           sessionId: currentGame.sessionId, // Add sessionId for aggregation
           cashierId,
           gameProgress: 0, // Initial game progress
           selectedNumbers: [], // Empty for now
           win: 0, // Initial win amount is 0
           isVerified: false
         });

        // Validate the bet before adding to array
        const validationError = bet.validateSync();
        if (validationError) {
          console.error(`❌ Validation error for bet ${i + 1}:`, validationError);
          continue;
        }

        bets.push(bet);
        console.log(`✅ Bet ${i + 1} created successfully with ticket ${ticketNumber}`);
        
      } catch (error: any) {
        console.error(`❌ Error creating bet ${i + 1} for cartela ${cartelaId}:`, error);
        continue;
      }
    }

    // Save all bets
    await Promise.all(bets.map(bet => bet.save()));

    // Update game data with new bets - initialize gameData if it doesn't exist
    if (!currentGame.gameData) {
      currentGame.gameData = {
        calledNumbers: [],
        progress: 0,
        cartelas: 0,
        stack: 0, // Add individual stake field
        totalStack: 0,
        totalWinStack: 0,
        totalShopMargin: 0,
        totalSystemFee: 0,
        netPrizePool: 0,
        netShopProfit: 0, // Add missing field

        selectedCartelas: [],
        winPatterns: [],
        drawHistory: [],
        placedBetCartelas: [], // Track which cartelas have placed bets
        winningCartelas: [] // Track winning cartelas when game is completed
      };
    }

    // At this point, gameData is guaranteed to exist
    const gameData = currentGame.gameData!;
    
    // Initialize placedBetCartelas array if it doesn't exist
    if (!gameData.placedBetCartelas) {
      gameData.placedBetCartelas = [];
    }
    
    // Add the newly placed bet cartelas to the list
    gameData.placedBetCartelas = [...new Set([...gameData.placedBetCartelas, ...cartelaIds])];
    
    // Update the game data
    gameData.cartelas = (gameData.cartelas || 0) + cartelaIds.length;
    
    // Set the individual stake amount if this is the first bet (stack is 0)
    if (gameData.stack === 0) {
      gameData.stack = stake;
      console.log(`🔒 Setting locked stake amount to Br. ${stake} for game ${currentGame.gameId}`);
    }
    
    gameData.totalStack = (gameData.totalStack || 0) + totalStake;
    gameData.totalWinStack = (gameData.totalWinStack || 0) + winnerPrizePool;
    await currentGame.save();

    // Update game with aggregated data from all bets to ensure accuracy
    try {
      const { GameAggregationService } = await import('../services/gameAggregationService');
      await GameAggregationService.updateGameWithAggregatedData(currentGame.sessionId, currentGame.gameId);
      console.log(`💰 Game ${currentGame.sessionId} (ID: ${currentGame.gameId}) updated with aggregated bet data`);
    } catch (aggregationError) {
      console.error('Error updating game with aggregated data:', aggregationError);
      // Don't fail the bet placement if aggregation fails
    }

    // Emit real-time updates immediately after bet placement
    const io = req.app.locals.io;
    if (io && currentGame.sessionId) {
      try {
        // Get updated game data for emission
        const updatedGame = await Game.findById(currentGame._id);
        if (updatedGame && updatedGame.gameData) {
          // Emit game data updated to display
          io.to(`display:${currentGame.sessionId}`).emit('game_data_updated', {
            id: updatedGame.gameId,
            status: updatedGame.status,
            gameData: updatedGame.gameData,
            sessionId: currentGame.sessionId
          });
          
          // Also emit to cashier for real-time updates
          if (currentGame.cashierId) {
            console.log(`📡 BetController: Emitting game_data_updated to cashier:${currentGame.cashierId} for session ${currentGame.sessionId}`);
            io.to(`cashier:${currentGame.cashierId}`).emit('game_data_updated', {
              id: updatedGame.gameId,
              status: updatedGame.status,
              gameData: updatedGame.gameData,
              sessionId: currentGame.sessionId
            });
            console.log(`✅ BetController: game_data_updated emitted to cashier:${currentGame.cashierId}`);
          }
          
          // Also emit placed bets updated
          io.to(`display:${currentGame.sessionId}`).emit('placed_bets_updated', {
            placedBetCartelas: updatedGame.gameData.placedBetCartelas || [],
            gameId: updatedGame._id,
            timestamp: new Date()
          });
          
          console.log(`📡 Real-time updates emitted immediately after bet placement to display and cashier`);
        }
      } catch (socketError) {
        console.error('Error emitting real-time updates:', socketError);
        // Don't fail the bet placement if socket emission fails
      }
    }
    
    console.log(`✅ Bet placement completed - real-time updates emitted immediately`);

         // 🖨️ TICKET PRINTING: Print tickets for all placed bets
     try {
       console.log('🖨️ Starting ticket printing process for REST API...');
       
       // Prepare ticket data for each bet
       const ticketsToPrint: BingoTicketData[] = [];
       
       for (let i = 0; i < ticketNumbers.length; i++) {
         const ticketNumber = ticketNumbers[i];
         const cartelaId = cartelaIds[i];
         
         // Get cartela numbers from database
         const { Cartela } = await import('../models/Cartela');
         const cartela = await Cartela.findOne({ 
           cartelaId: cartelaId, 
           cashierId: cashierId,
           isActive: true 
         });
         
         // Convert 2D pattern to 1D array for printing
         let cartelaNumbers: number[] = [];
         if (cartela && cartela.pattern) {
           cartelaNumbers = cartela.pattern.flat(); // Flatten 2D array to 1D
         } else {
           // Fallback to default numbers if cartela not found
           cartelaNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
         }
         
         ticketsToPrint.push({
           ticketNumber,
           cashierFirstName: cashier.fullName || 'Unknown',
           cashierUsername: cashier.username || 'unknown',
           gameId: gameIdToUse,
           cartelaId: cartelaId,
           stake,
           cartelaNumbers: cartelaNumbers,
           dateTime: new Date()
         });
       }
       
       // Print all tickets directly without connection check
       console.log('🖨️ DEBUG: Attempting to print', ticketsToPrint.length, 'tickets...');
       const printResults = await printerService.printMultipleBingoTickets(ticketsToPrint);
       
       // Log print results
       const successfulPrints = printResults.filter(result => result.success).length;
       const failedPrints = printResults.filter(result => !result.success).length;
       
       console.log(`🖨️ Ticket printing completed: ${successfulPrints} successful, ${failedPrints} failed`);
       
       // Log any failed prints
       if (failedPrints > 0) {
         printResults.forEach((result, index) => {
           if (!result.success) {
             console.error(`❌ Failed to print ticket ${ticketsToPrint[index].ticketNumber}:`, result.error);
           }
         });
       }
     } catch (printError) {
       console.error('❌ Error during ticket printing:', printError);
       // Don't fail the bet placement if printing fails
     }

    ResponseService.success(res, {
       ticketNumbers,
       cartelaIds,
       stake,
       totalStake,
       winnerPrizePool,
       gameId: gameIdToUse
     }, 'Bets placed successfully');

  } catch (error) {
    console.error('Error in placeBet:', error);
    ResponseService.serverError(res, 'Failed to place bet');
  }
};

// Get recent bets for current game
export const getRecentBets = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    // Get current game to filter bets by current game ID only
    const currentGame = await Game.findOne({ 
      cashierId, 
      status: 'waiting' 
    }).sort({ lastActivity: -1 });

    if (!currentGame) {
      ResponseService.success(res, [], 'No waiting game found');
      return;
    }

    // Only get bets for the current game, excluding cancelled bets
    const bets = await Bet.find({
      cashierId,
      gameId: currentGame.gameId,
      betStatus: { $ne: 'cancelled' } // Exclude cancelled bets
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('ticketNumber cartelaNumber amount status createdAt gameId betStatus');

    ResponseService.success(res, bets, 'Recent bets for current game retrieved successfully');

  } catch (error) {
    console.error('Error in getRecentBets:', error);
    ResponseService.serverError(res, 'Failed to retrieve recent bets');
  }
};

// Get all historical bets for recall functionality
export const getRecallBets = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    // Get all bets for this cashier from all games, excluding cancelled bets, sorted by most recent first
    const bets = await Bet.find({
      cashierId,
      betStatus: { $ne: 'cancelled' } // Exclude cancelled bets
    })
      .sort({ placedAt: -1 })
      .limit(100) // Limit to last 100 bets for performance
      .select('ticketNumber cartelaId stake placedAt gameId sessionId betStatus');

    // Transform the data to match the frontend interface
    const transformedBets = bets.map(bet => ({
      ticketNumber: bet.ticketNumber,
      cartelaNumber: bet.cartelaId,
      amount: bet.stake, // Use stake as the amount
      createdAt: bet.placedAt, // Map placedAt to createdAt for frontend compatibility
      gameId: bet.gameId,
      _id: bet._id,
      sessionId: bet.sessionId
    }));

    ResponseService.success(res, transformedBets, 'Recall bets retrieved successfully');

  } catch (error) {
    console.error('Error in getRecallBets:', error);
    ResponseService.serverError(res, 'Failed to retrieve recall bets');
  }
};

// Get bet by ticket number
export const getBetByTicketNumber = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const { ticketNumber } = req.params;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    const bet = await Bet.findOne({ ticketNumber, cashierId });
    if (!bet) {
      ResponseService.notFound(res, 'Bet not found');
      return;
    }

    ResponseService.success(res, bet, 'Bet retrieved successfully');

  } catch (error) {
    console.error('Error in getBetByTicketNumber:', error);
    ResponseService.serverError(res, 'Failed to retrieve bet');
  }
};

// Print recall ticket
export const printRecallTicket = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const { ticketNumber } = req.params;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    // Find the bet
    const bet = await Bet.findOne({ 
      ticketNumber, 
      cashierId,
      betStatus: { $ne: 'cancelled' }
    });

    if (!bet) {
      ResponseService.notFound(res, 'Bet not found');
      return;
    }

    // Get cartela data
    const { Cartela } = await import('../models/Cartela');
    const cartela = await Cartela.findOne({ 
      cartelaId: bet.cartelaId, 
      cashierId: cashierId,
      isActive: true 
    });

    // Convert 2D pattern to 1D array for printing
    let cartelaNumbers: number[] = [];
    if (cartela && cartela.pattern) {
      cartelaNumbers = cartela.pattern.flat(); // Flatten 2D array to 1D
    } else {
      // Fallback to default numbers if cartela not found
      cartelaNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
    }

    // Get cashier data
    const cashier = await Cashier.findById(cashierId);
    if (!cashier) {
      ResponseService.notFound(res, 'Cashier not found');
      return;
    }

    // Prepare ticket data for printing
    const ticketData = {
      ticketNumber: bet.ticketNumber,
      cashierFirstName: cashier.fullName || 'Unknown',
      cashierUsername: cashier.username || 'unknown',
      gameId: bet.gameId.toString(),
      cartelaId: bet.cartelaId,
      stake: bet.stake,
      cartelaNumbers: cartelaNumbers,
      dateTime: bet.placedAt
    };

    // Print the ticket using the existing printer service
    const { printerService } = await import('../utils/printerService');
    const printResult = await printerService.printBingoTicket(ticketData);

    if (printResult.success) {
      ResponseService.success(res, { message: 'Ticket printed successfully' }, 'Ticket printed successfully');
    } else {
      ResponseService.serverError(res, printResult.error || 'Failed to print ticket');
    }

  } catch (error) {
    console.error('Error in printRecallTicket:', error);
    ResponseService.serverError(res, 'Failed to print ticket');
  }
};

// Get placed bet cartelas for current game (for cashiers)
export const getPlacedBetCartelas = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    // Get current game
    const currentGame = await Game.findOne({ 
      cashierId, 
      status: 'waiting' 
    }).sort({ lastActivity: -1 });

    if (!currentGame) {
      ResponseService.success(res, [], 'No waiting game found');
      return;
    }

    // Get placed bet cartelas from game data
    const placedBetCartelas = currentGame.gameData?.placedBetCartelas || [];

    ResponseService.success(res, placedBetCartelas, 'Placed bet cartelas retrieved successfully');

  } catch (error) {
    console.error('Error in getPlacedBetCartelas:', error);
    ResponseService.serverError(res, 'Failed to get placed bet cartelas');
  }
};

// Get placed bet cartelas for current game (for displays - no authentication required)
export const getPlacedBetCartelasForDisplay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      ResponseService.badRequest(res, 'Session ID is required');
      return;
    }

    // Get current game by displayToken (which is what the display sends as sessionId)
    const currentGame = await Game.findOne({ 
      displayToken: sessionId, 
      status: 'waiting' 
    }).sort({ lastActivity: -1 });

    if (!currentGame) {
      ResponseService.success(res, [], 'No waiting game found for this display token');
      return;
    }

    // Get placed bet cartelas from game data
    const placedBetCartelas = currentGame.gameData?.placedBetCartelas || [];

    ResponseService.success(res, placedBetCartelas, 'Placed bet cartelas retrieved successfully for display');

  } catch (error) {
    console.error('Error in getPlacedBetCartelasForDisplay:', error);
    ResponseService.serverError(res, 'Failed to get placed bet cartelas for display');
  }
};

// Search ticket by number for cancellation
export const searchTicketByNumber = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const { ticketNumber } = req.params;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!ticketNumber || !/^\d{13}$/.test(ticketNumber)) {
      ResponseService.validationError(res, 'Invalid ticket number format. Must be 13 digits.');
      return;
    }

    // Find the bet by ticket number
    const bet = await Bet.findOne({ ticketNumber, cashierId });
    if (!bet) {
      ResponseService.notFound(res, 'Ticket not found');
      return;
    }

    // Get the game to check status - check both active games and completed games
    let game = await Game.findOne({ gameId: bet.gameId, cashierId });
    
    // If not found in active games, check completed games
    if (!game) {
      const CompletedGame = (await import('../models/CompletedGame')).default;
      // Convert string cashierId to ObjectId for CompletedGame search
      const mongoose = await import('mongoose');
      const cashierObjectId = new mongoose.Types.ObjectId(cashierId);
      game = await CompletedGame.findOne({ gameId: bet.gameId, cashierId: cashierObjectId });
    }
    
    if (!game) {
      ResponseService.notFound(res, 'Game not found for this ticket');
      return;
    }

    // Check if bet is already cancelled
    if (bet.betStatus === 'cancelled') {
      ResponseService.validationError(res, 'Ticket is already cancelled');
      return;
    }

    // Get cartela details
    const cartela = await Cartela.findOne({ cartelaId: bet.cartelaId, cashierId });
    if (!cartela) {
      ResponseService.notFound(res, 'Cartela not found for this ticket');
      return;
    }

    // Resolve fields that differ between active and completed games
    const resolvedNetPrizePool: number = (game as any)?.gameData?.netPrizePool ?? (game as any)?.gameData?.finalNetPrizePool ?? 0;
    const resolvedCalledNumbers: number[] = (game as any)?.gameData?.calledNumbers ?? (game as any)?.gameData?.finalCalledNumbers ?? [];

    // Debug logging to see what we're getting
    console.log('🔍 Debug Prize Pool Values:');
    console.log('🔍 Game ID:', bet.gameId);
    console.log('🔍 Game Status:', game.status);
    console.log('🔍 Bet Status:', bet.betStatus);
    console.log('🔍 Game Data:', game.gameData);
    console.log('🔍 netPrizePool:', (game as any)?.gameData?.netPrizePool);
    console.log('🔍 finalNetPrizePool:', (game as any)?.gameData?.finalNetPrizePool);
    console.log('🔍 resolvedNetPrizePool:', resolvedNetPrizePool);

    // Check if this game already has a redeemed ticket (any ticket with 'won_redeemed' or 'lost_redeemed' status)
    const gameAlreadyRedeemed = await Bet.findOne({
      gameId: bet.gameId,
      cashierId,
      betStatus: { $in: ['won_redeemed', 'lost_redeemed'] }
    });

    console.log('🔍 Game Already Redeemed:', gameAlreadyRedeemed);

    // Determine the final prize amount and redemption status
    let finalPrizeAmount = 0;
    let canRedeem = false;
    let redemptionStatus = 'available';
    
    if (String(game.status) === 'completed') {
      if (gameAlreadyRedeemed) {
        // Game already has a redeemed ticket - no more redemptions
        redemptionStatus = 'already_redeemed';
        canRedeem = false;
        
        // Extract prize from the already redeemed ticket
        const redeemedTicket = await Bet.findOne({
          gameId: bet.gameId,
          cashierId,
          betStatus: 'won_redeemed'
        });
        
        if (redeemedTicket && redeemedTicket.notes) {
          const prizeMatch = redeemedTicket.notes.match(/Won! Prize: Br\. ([\d.]+)/);
          if (prizeMatch) {
            finalPrizeAmount = parseFloat(prizeMatch[1]);
            console.log('🔍 Game Already Redeemed - Prize was:', finalPrizeAmount);
          }
        }
      } else {
        // No redemption yet - this ticket can be redeemed if it's a winner
        redemptionStatus = 'available';
        canRedeem = bet.betStatus === 'won';
        finalPrizeAmount = resolvedNetPrizePool;
        console.log('🔍 Game Available for Redemption - Prize Pool:', finalPrizeAmount);
      }
    }

    console.log('🔍 Final Prize Amount:', finalPrizeAmount);

    // Return ticket details for cancellation and redemption
    const ticketData = {
      ticketNumber: bet.ticketNumber,
      betId: bet.betId,
      cartelaId: bet.cartelaId,
      stake: bet.stake,
      gameId: bet.gameId,
      gameStatus: game.status,
      betStatus: bet.betStatus,
      placedAt: bet.placedAt,
      cartelaPattern: cartela.pattern,
      canCancel: game.status === 'waiting' && bet.betStatus === 'pending',
      canRedeem: canRedeem,
      redemptionStatus: redemptionStatus,
      // Show correct prize amount for all tickets from completed games
      prizeAmount: finalPrizeAmount,
      // Include win field for all tickets (0 for lost tickets, actual amount for redeemed)
      win: bet.win || 0,
      // Use existing gameData structure for total game prize pool
      gameData: {
        netPrizePool: resolvedNetPrizePool,
        totalStack: (game as any)?.gameData?.totalStack || (game as any)?.gameData?.finalTotalStack || 0
      },
      winningNumbers: resolvedCalledNumbers
    };

    // Debug logging for canRedeem calculation
    console.log('🔍 Can Redeem Debug:');
    console.log('🔍 Game Status === completed:', String(game.status) === 'completed');
    console.log('🔍 Bet Status === active:', bet.betStatus === 'active');
    console.log('🔍 Bet Status === won:', bet.betStatus === 'won');
    console.log('🔍 Final canRedeem:', canRedeem);
    console.log('🔍 Final ticketData:', ticketData);

    ResponseService.success(res, ticketData, 'Ticket found successfully');

  } catch (error) {
    console.error('Error in searchTicketByNumber:', error);
    ResponseService.serverError(res, 'Failed to search ticket');
  }
};

// Cancel a ticket
export const cancelTicket = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const { ticketNumber } = req.params;
    const cashierId = req.cashier?.id;
    const { reason } = req.body;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!ticketNumber || !/^\d{13}$/.test(ticketNumber)) {
      ResponseService.validationError(res, 'Invalid ticket number format. Must be 13 digits.');
      return;
    }

    // Find the bet by ticket number
    const bet = await Bet.findOne({ ticketNumber, cashierId });
    if (!bet) {
      ResponseService.notFound(res, 'Ticket not found');
      return;
    }

    // Get the game to check status - check both active games and completed games
    let game = await Game.findOne({ gameId: bet.gameId, cashierId });
    
    // If not found in active games, check completed games
    if (!game) {
      const CompletedGame = (await import('../models/CompletedGame')).default;
      game = await CompletedGame.findOne({ gameId: bet.gameId, cashierId });
    }
    
    if (!game) {
      ResponseService.notFound(res, 'Game not found for this ticket');
      return;
    }

    // Check if ticket can be cancelled (only waiting status games)
    if (game.status === 'active') {
      ResponseService.validationError(res, 'Game is already started! Cannot cancel tickets during active games. Only waiting games can be cancelled.');
      return;
    }
    
    if (game.status !== 'waiting') {
      ResponseService.validationError(res, `Cannot cancel ticket. Game status is ${game.status}. Only waiting games can be cancelled.`);
      return;
    }

    // Check if bet is already cancelled
    if (bet.betStatus === 'cancelled') {
      ResponseService.validationError(res, 'Ticket is already cancelled');
      return;
    }

    // Use the BetService to cancel the bet
    const { BetService } = await import('../services/betService');
    const cancelledBet = await BetService.cancelBet(bet.betId, cashierId, reason || 'Cancelled by cashier');

    // Emit real-time updates via socket
    const io = req.app.locals.io;
    if (io && game.sessionId) {
      try {
        // Get updated game data for emission
        const updatedGame = await Game.findById(game._id);
        if (updatedGame && updatedGame.gameData) {
          // Emit game data updated to display
          io.to(`display:${game.sessionId}`).emit('game_data_updated', {
            id: updatedGame.gameId,
            status: updatedGame.status,
            gameData: updatedGame.gameData,
            sessionId: game.sessionId
          });
          
          // Also emit to cashier for real-time updates
          if (game.cashierId) {
            io.to(`cashier:${game.cashierId}`).emit('game_data_updated', {
              id: updatedGame.gameId,
              status: updatedGame.status,
              gameData: updatedGame.gameData,
              sessionId: game.sessionId
            });
          }
          
          // Emit ticket cancelled event
          io.to(`display:${game.sessionId}`).emit('ticket_cancelled', {
            ticketNumber,
            cartelaId: bet.cartelaId,
            gameId: bet.gameId,
            sessionId: game.sessionId,
            timestamp: new Date()
          });
          
          if (game.cashierId) {
            io.to(`cashier:${game.cashierId}`).emit('ticket_cancelled', {
              ticketNumber,
              cartelaId: bet.cartelaId,
              gameId: bet.gameId,
              sessionId: game.sessionId,
              timestamp: new Date()
            });
          }
          
          console.log(`📡 Real-time updates emitted after ticket cancellation`);
        }
      } catch (socketError) {
        console.error('Error emitting real-time updates:', socketError);
        // Don't fail the cancellation if socket emission fails
      }
    }

    console.log(`✅ Ticket ${ticketNumber} cancelled successfully by cashier ${cashierId}`);

    ResponseService.success(res, {
      ticketNumber,
      betId: bet.betId,
      cartelaId: bet.cartelaId,
      stake: bet.stake,
      gameId: bet.gameId,
      cancelledAt: new Date(),
      reason: reason || 'Cancelled by cashier'
    }, 'Ticket cancelled successfully');

  } catch (error) {
    console.error('Error in cancelTicket:', error);
    ResponseService.serverError(res, 'Failed to cancel ticket');
  }
};

// Redeem a ticket (only for completed games)
export const redeemTicket = async (req: BetRequest, res: Response): Promise<void> => {
  try {
    const { ticketNumber } = req.params;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!ticketNumber || !/^\d{13}$/.test(ticketNumber)) {
      ResponseService.validationError(res, 'Invalid ticket number format. Must be 13 digits.');
      return;
    }

    // Find the bet by ticket number
    const bet = await Bet.findOne({ ticketNumber, cashierId });
    if (!bet) {
      ResponseService.notFound(res, 'Ticket not found');
      return;
    }

    // Get the game to check status - check both active games and completed games
    let game = await Game.findOne({ gameId: bet.gameId, cashierId });
    
    // If not found in active games, check completed games
    if (!game) {
      const CompletedGame = (await import('../models/CompletedGame')).default;
      game = await CompletedGame.findOne({ gameId: bet.gameId, cashierId });
    }
    
    if (!game) {
      ResponseService.notFound(res, 'Game not found for this ticket');
      return;
    }

    // Check if game is completed (only completed games can be redeemed)
    if (game.status !== 'completed') {
      ResponseService.validationError(res, `Cannot redeem ticket. Game status is ${game.status}. Only completed games can be redeemed.`);
      return;
    }

    // Check if bet is already redeemed
    if (bet.betStatus === 'won_redeemed' || bet.betStatus === 'lost_redeemed') {
      ResponseService.validationError(res, 'Ticket is already redeemed');
      return;
    }

    // Check if bet was cancelled
    if (bet.betStatus === 'cancelled') {
      ResponseService.validationError(res, 'Cannot redeem a cancelled ticket');
      return;
    }

    // Get cartela details to check win pattern
    const cartela = await Cartela.findOne({ cartelaId: bet.cartelaId, cashierId });
    if (!cartela) {
      ResponseService.notFound(res, 'Cartela not found');
      return;
    }

    // New logic: First person to redeem gets the prize, others stay as lost
    // Check if any other ticket from this game has already been redeemed as winner
    const alreadyRedeemedWinner = await Bet.findOne({
      gameId: bet.gameId,
      cashierId,
      betStatus: 'won_redeemed'
    });

    let isWinner = false;
    let prizeAmount = 0;

    if (alreadyRedeemedWinner) {
      // Someone already won this game - no prize for others
      isWinner = false;
      prizeAmount = 0;
    } else {
      // First ticket to be redeemed - gets the full prize
      isWinner = true;
      // Use netPrizePool for active games, finalNetPrizePool for completed games
      prizeAmount = ((game as any)?.gameData?.netPrizePool ?? (game as any)?.gameData?.finalNetPrizePool ?? 0) as number;
      
      // Mark all other tickets from this game as lost (not redeemed)
      await Bet.updateMany(
        { 
          gameId: bet.gameId, 
          cashierId,
          betId: { $ne: bet.betId },
          betStatus: { $nin: ['cancelled', 'won_redeemed', 'lost_redeemed'] }
        },
        { 
          betStatus: 'lost',
          settledAt: new Date(),
          win: 0, // Set win amount to 0 for losing tickets
          notes: 'Game already won by another ticket'
        }
      );
    }

    // Update bet status to appropriate redeemed status and set win amount
    bet.betStatus = isWinner ? 'won_redeemed' : 'lost_redeemed';
    bet.settledAt = new Date();
    bet.win = prizeAmount; // Set the win amount (0 for losers, prize amount for winner)
    bet.notes = isWinner ? `Won! Prize: Br. ${prizeAmount.toFixed(2)}` : 'Game already redeemed by another ticket';
    await bet.save();

    // CRITICAL: Mark ALL remaining tickets from this gameId as lost_redeemed (per-game management)
    // This ensures that when ANY ticket is redeemed, ALL tickets from that game are removed from "Unclaimed"
    const remainingTicketsResult = await Bet.updateMany(
      { 
        gameId: bet.gameId, 
        cashierId,
        betId: { $ne: bet.betId }, // Exclude the current ticket
        betStatus: { $in: ['won', 'lost'] } // Only update won/lost tickets (no pending after game ends)
      },
      { 
        betStatus: 'lost_redeemed',
        settledAt: new Date(),
        win: 0, // Set win amount to 0 for non-winning tickets
        notes: 'Game fully redeemed - all tickets processed'
      }
    );
    
    if (remainingTicketsResult.modifiedCount > 0) {
      console.log(`🎫 Marked ${remainingTicketsResult.modifiedCount} remaining tickets as redeemed for game ${bet.gameId} (per-game management)`);
    }

    // If winner, update game data to reflect payout
    if (isWinner) {
      await Game.findOneAndUpdate(
        { gameId: bet.gameId, sessionId: bet.sessionId },
        {
          $inc: {
            'gameData.totalPaidOut': prizeAmount
          },
          lastActivity: new Date()
        }
      );
    }

    // Emit real-time updates via socket
    const io = req.app.locals.io;
    if (io && game.sessionId) {
      try {
                 // Emit ticket redeemed event
         io.to(`display:${game.sessionId}`).emit('ticket_redeemed', {
           ticketNumber,
           cartelaId: bet.cartelaId,
           gameId: bet.gameId,
           sessionId: game.sessionId,
           isWinner,
           prizeAmount,
           timestamp: new Date()
         });
        
                 if (game.cashierId) {
           io.to(`cashier:${game.cashierId}`).emit('ticket_redeemed', {
             ticketNumber,
             cartelaId: bet.cartelaId,
             gameId: bet.gameId,
             sessionId: game.sessionId,
             isWinner,
             prizeAmount,
             timestamp: new Date()
           });
         }
        
        console.log(`📡 Real-time updates emitted after ticket redemption`);
      } catch (socketError) {
        console.error('Error emitting real-time updates:', socketError);
        // Don't fail the redemption if socket emission fails
      }
    }

    console.log(`✅ Ticket ${ticketNumber} redeemed successfully by cashier ${cashierId}. Winner: ${isWinner}, Prize: Br. ${prizeAmount.toFixed(2)}`);

         ResponseService.success(res, {
       ticketNumber,
       betId: bet.betId,
       cartelaId: bet.cartelaId,
       stake: bet.stake,
       gameId: bet.gameId,
       isWinner,
       prizeAmount,
       win: bet.win, // Include the win amount in response
       redeemedAt: new Date(),
       message: isWinner ? `🎉 Congratulations! You won Br. ${prizeAmount.toFixed(2)}` : 'Game already won by another ticket'
     }, 'Ticket redeemed successfully');

  } catch (error) {
    console.error('Error in redeemTicket:', error);
    ResponseService.serverError(res, 'Failed to redeem ticket');
  }
};

export default {
  placeBet,
  getRecentBets,
  getRecallBets,
  getBetByTicketNumber,
  printRecallTicket,
  getPlacedBetCartelas,
  searchTicketByNumber,
  cancelTicket,
  redeemTicket
};
