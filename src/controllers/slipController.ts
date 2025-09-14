import { Request, Response } from 'express';
import { ResponseService } from '../services/responseService';
import Bet from '../models/Bet';
import Cashier from '../models/Cashier';
import Shop from '../models/Shop';
import { Cartela } from '../models/Cartela';
import Game from '../models/Game';
import CompletedGame from '../models/CompletedGame';

// Admin search for slip details
export const searchSlips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, cashierId, date, ticketNumber, gameId } = {
      ...req.query,
      ...req.body
    };

    // Validate required parameters
    if (!shopId) {
      ResponseService.validationError(res, 'Shop ID is required');
      return;
    }

    // Build search criteria
    const searchCriteria: any = {};

    // Add cashier filter if provided
    if (cashierId) {
      searchCriteria.cashierId = cashierId;
    }

    // Add date filter if provided
    if (date) {
      const searchDate = new Date(date as string);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      searchCriteria.placedAt = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    // Add ticket number filter if provided
    if (ticketNumber) {
      searchCriteria.ticketNumber = ticketNumber;
    }

    // Add game ID filter if provided
    if (gameId) {
      searchCriteria.gameId = gameId;
    }

    // Search for bets
    const bets = await Bet.find(searchCriteria)
      .populate('cashierId', 'username fullName')
      .sort({ placedAt: -1 });

    // Transform results to match the expected format
    const slipDetails = [];

    for (const bet of bets) {
      console.log(`🔍 Processing bet:`, {
        ticketNumber: bet.ticketNumber,
        cartelaId: bet.cartelaId,
        cashierId: bet.cashierId,
        cashierIdType: typeof bet.cashierId
      });
      
      // Get cashier info to find shop
      const cashier = await Cashier.findById(bet.cashierId);
      if (cashier && cashier.shop?.toString() === shopId) {
        const shop = await Shop.findById(shopId);
        
        // Get cartela pattern for this bet
        let cartela = await Cartela.findOne({ 
          cartelaId: bet.cartelaId
        });
        
        // If not found, try with cashierId as string
        if (!cartela) {
          cartela = await Cartela.findOne({ 
            cartelaId: bet.cartelaId, 
            cashierId: bet.cashierId.toString()
          });
        }
        
        console.log(`🔍 Looking for cartela ${bet.cartelaId} with cashierId ${bet.cashierId.toString()}`);
        console.log(`🔍 Found cartela:`, cartela);
        console.log(`🔍 Cartela pattern:`, cartela?.pattern);
        
        // Use actual cartela pattern or empty array if not found
        let cartelaPattern = cartela?.pattern || [];
        if (cartelaPattern.length === 0) {
          console.log(`⚠️ No cartela pattern found for cartela ${bet.cartelaId}`);
        }
        
        // Get game data to find called numbers
        let calledNumbers: number[] = [];
        let gameStatus = 'unknown';
        
        if (bet.gameId) {
          // Try to find active game first
          const activeGame = await Game.findOne({ 
            gameId: bet.gameId,
            cashierId: bet.cashierId
          });
          
          if (activeGame) {
            calledNumbers = activeGame.gameData?.calledNumbers || [];
            gameStatus = activeGame.status;
          } else {
            // Try to find completed game
            const completedGame = await CompletedGame.findOne({ 
              gameId: bet.gameId,
              cashierId: bet.cashierId
            });
            
            if (completedGame) {
              calledNumbers = completedGame.gameData?.finalCalledNumbers || [];
              gameStatus = 'completed';
            }
          }
        }
        
        // Log if no called numbers found
        if (calledNumbers.length === 0) {
          console.log(`⚠️ No called numbers found for game ${bet.gameId}`);
        }
        
        slipDetails.push({
          ticketNumber: bet.ticketNumber,
          betId: bet.betId,
          gameId: bet.gameId,
          cashierId: bet.cashierId.toString(),
          cashierName: cashier.username,
          shopId: shopId,
          shopName: shop?.shopName || 'Unknown Shop',
          cartelaId: bet.cartelaId,
          stake: bet.stake,
          betType: bet.betType,
          betStatus: bet.betStatus,
          gameProgress: bet.gameProgress,
          selectedNumbers: bet.selectedNumbers,
          winPattern: bet.winPattern,
          win: bet.win || 0, // Add the win field
          notes: bet.notes,
          isVerified: bet.isVerified,
          verifiedBy: bet.verifiedBy?.toString(),
          verifiedAt: bet.verifiedAt,
          placedAt: bet.placedAt,
          settledAt: bet.settledAt,
          // Add cartela and game data
          cartelaPattern: cartelaPattern,
          calledNumbers: calledNumbers,
          gameStatus: gameStatus
        });
      }
    }

    ResponseService.success(res, slipDetails);

  } catch (error) {
    console.error('Error in searchSlips:', error);
    ResponseService.serverError(res, 'Failed to search slips');
  }
};
