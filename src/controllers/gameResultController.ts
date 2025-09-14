import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';
import Shop from '../models/Shop';
import CompletedGame from '../models/CompletedGame';
import Game from '../models/Game';
import Cashier from '../models/Cashier';

interface GameResult {
  eventId: string;
  shopId: string;
  shopName: string;
  calledNumbers: number[];
  drawTime: string;
  gameType: string;
}

interface GameSearchResult {
  gameId: string;
  status: string;
  gameStartTime?: Date;
  gameEndTime?: Date;
  finalProgress: number;
  finalCalledNumbers: number[];
  finalCurrentNumber: number | null;
  finalCartelas: number;
  finalTotalStack: number;
  finalTotalWinStack: number;
  finalTotalShopMargin: number;
  finalTotalSystemFee: number;
  finalNetPrizePool: number;
      finalDrawHistory: Array<{
      number: number;
      timestamp: Date;
      type?: string;
      drawnBy?: 'manual' | 'auto';
    }>;
  completedAt: Date;
}

// Get game results with search filters
export const getGameResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, date, time, eventId } = req.query;

    // Validate required parameters
    if (!shopId || !date || !eventId) {
      ResponseService.validationError(res, 'Shop ID, date, and event ID are required');
      return;
    }

    // Get shop information
    const shop = await Shop.findById(shopId);
    if (!shop) {
      ResponseService.notFound(res, 'shop');
      return;
    }

    // TODO: Implement real game results query from database
    // For now, return empty results until real data is available
    const gameResults: GameResult[] = [];

    ResponseService.success(res, gameResults);
  } catch (error) {
    console.error('Error in getGameResults:', error);
    ResponseService.serverError(res, 'Failed to fetch game results');
  }
};

// Search for games by date/time and game ID
export const searchGames = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract from both query params and body (POST request)
    const { startDate, endDate, gameId, cashierId } = {
      ...req.query,
      ...req.body
    };

    // If Game ID is provided, search for that specific game ONLY
    if (gameId && gameId.toString().trim() !== '') {
      // Search for the specific game by ID - EXACT MATCH ONLY
      const specificGame = await Game.findOne({ gameId: gameId.toString() });
      const specificCompletedGame = await CompletedGame.findOne({ gameId: gameId.toString() });

      if (specificGame || specificCompletedGame) {
        const gameToReturn = specificGame || specificCompletedGame;
        
        if (gameToReturn) {
          let result: GameSearchResult;
          
          if (specificGame) {
            // Active game
            result = {
              gameId: specificGame.gameId,
              status: specificGame.status,
              gameStartTime: specificGame.gameData?.gameStartTime,
              gameEndTime: specificGame.gameData?.gameEndTime,
              finalProgress: specificGame.gameData?.progress || 0,
              finalCalledNumbers: specificGame.gameData?.calledNumbers || [],
              finalCurrentNumber: specificGame.gameData?.currentNumber || null,
              finalCartelas: specificGame.gameData?.cartelas || 0,
              finalTotalStack: specificGame.gameData?.totalStack || 0,
              finalTotalWinStack: specificGame.gameData?.totalWinStack || 0,
              finalTotalShopMargin: specificGame.gameData?.totalShopMargin || 0,
              finalTotalSystemFee: specificGame.gameData?.totalSystemFee || 0,
              finalNetPrizePool: specificGame.gameData?.netPrizePool || 0,
              finalDrawHistory: (specificGame.gameData?.drawHistory || []).map(draw => ({
                number: draw.number,
                timestamp: draw.timestamp,
                type: draw.drawnBy || 'unknown'
              })),
              completedAt: specificGame.updatedAt
            };
          } else if (specificCompletedGame) {
            // Completed game
            result = {
              gameId: specificCompletedGame.gameId.toString(),
              status: specificCompletedGame.status,
              gameStartTime: specificCompletedGame.gameData?.gameStartTime,
              gameEndTime: specificCompletedGame.gameData?.gameEndTime,
              finalProgress: specificCompletedGame.gameData?.finalProgress || 0,
              finalCalledNumbers: specificCompletedGame.gameData?.finalCalledNumbers || [],
              finalCurrentNumber: specificCompletedGame.gameData?.finalCurrentNumber || null,
              finalCartelas: specificCompletedGame.gameData?.finalCartelas || 0,
              finalTotalStack: specificCompletedGame.gameData?.finalTotalStack || 0,
              finalTotalWinStack: specificCompletedGame.gameData?.finalTotalWinStack || 0,
              finalTotalShopMargin: specificCompletedGame.gameData?.finalTotalShopMargin || 0,
              finalTotalSystemFee: specificCompletedGame.gameData?.finalTotalSystemFee || 0,
              finalNetPrizePool: specificCompletedGame.gameData?.finalNetPrizePool || 0,
              finalDrawHistory: specificCompletedGame.gameData?.finalDrawHistory || [],
              completedAt: specificCompletedGame.completedAt
            };
          } else {
            throw new Error('Game not found');
          }

          ResponseService.success(res, {
            results: [result], // ONLY ONE RESULT - the exact game
            total: 1,
            activeGames: specificGame ? 1 : 0,
            completedGames: specificCompletedGame ? 1 : 0
          });
          return; // CRITICAL: Exit here, don't continue to date search
        }
      } else {
        // Return empty results when no game found
        ResponseService.success(res, {
          results: [],
          total: 0,
          activeGames: 0,
          completedGames: 0
        });
        return; // CRITICAL: Exit here, don't continue to date search
      }
    }

    // If no Game ID provided, return error - both fields are required
    ResponseService.validationError(res, 'Both Date and Event No are required');
    return;

  } catch (error) {
    console.error('Error in searchGames:', error);
    ResponseService.serverError(res, 'Failed to search games');
  }
};

// Admin search for game results with shop and cashier filtering
export const searchAdminGameResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, cashierId, date, eventId } = {
      ...req.query,
      ...req.body
    };

    // Validate required parameters
    if (!shopId || !date || !eventId) {
      ResponseService.validationError(res, 'Shop ID, date, and event ID are required');
      return;
    }

    // Build search criteria for games
    const gameSearchCriteria: any = {
      gameId: eventId.toString()
    };

    // Add cashier filter if provided
    if (cashierId) {
      gameSearchCriteria.cashierId = cashierId;
    }

    // Add date filter
    if (date) {
      const searchDate = new Date(date as string);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      gameSearchCriteria.createdAt = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    // Search in both active games and completed games
    const [activeGames, completedGames] = await Promise.all([
      Game.find(gameSearchCriteria).sort({ createdAt: -1 }),
      CompletedGame.find(gameSearchCriteria).sort({ createdAt: -1 })
    ]);

    // Transform results to match the expected format
    const gameResults = [];

    // Process active games
    for (const game of activeGames) {
      // Get cashier info to find shop
      const cashier = await Cashier.findById(game.cashierId);
      if (cashier && cashier.shop?.toString() === shopId) {
        const shop = await Shop.findById(shopId);
        gameResults.push({
          eventId: game.gameId,
          shopId: shopId,
          shopName: shop?.shopName || 'Unknown Shop',
          calledNumbers: game.gameData?.calledNumbers || [],
          drawTime: game.createdAt,
          gameType: 'Bingo'
        });
      }
    }

    // Process completed games
    for (const game of completedGames) {
      // Get cashier info to find shop
      const cashier = await Cashier.findById(game.cashierId);
      if (cashier && cashier.shop?.toString() === shopId) {
        const shop = await Shop.findById(shopId);
        gameResults.push({
          eventId: game.gameId.toString(),
          shopId: shopId,
          shopName: shop?.shopName || 'Unknown Shop',
          calledNumbers: game.gameData?.finalCalledNumbers || [],
          drawTime: game.completedAt,
          gameType: 'Bingo'
        });
      }
    }

    ResponseService.success(res, gameResults);

  } catch (error) {
    console.error('Error in searchAdminGameResults:', error);
    ResponseService.serverError(res, 'Failed to search admin game results');
  }
}; 