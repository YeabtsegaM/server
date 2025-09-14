import mongoose from 'mongoose';
import Bet from '../models/Bet';
import Game from '../models/Game';
import Shop from '../models/Shop';
import { generateGameId } from '../utils/gameIdUtils';

/**
 * Bet Service - Handles all betting operations
 * 
 * Features:
 * - Place new bets
 * - Verify bets
 * - Track bet status
 * - Calculate winnings
 * - Bet reporting
 */
export class BetService {
  
  /**
   * Get shop ID from cashier ID
   */
  private static async getShopIdFromCashier(cashierId: string): Promise<string[]> {
    try {
      // Import Cashier model dynamically to avoid circular dependencies
      const Cashier = (await import('../models/Cashier')).default;
      const cashier = await Cashier.findById(cashierId);
      
      if (!cashier) {
        throw new Error('Cashier not found');
      }
      
      // Return array with single shop ID (cashier belongs to one shop)
      return [cashier.shop.toString()];
    } catch (error) {
      console.error('Error getting shop ID from cashier:', error);
      return [];
    }
  }
  
  /**
   * Generate unique ticket number (13 digits)
   */
  private static async generateTicketNumber(): Promise<string> {
    // Get the last ticket number from database
    const lastBet = await Bet.findOne().sort({ ticketNumber: -1 });
    
    if (!lastBet) {
      return '0000000000001'; // First ticket
    }
    
    // Increment the last ticket number
    const lastNumber = parseInt(lastBet.ticketNumber, 10);
    const nextNumber = lastNumber + 1;
    
    return nextNumber.toString().padStart(13, '0');
  }

  /**
   * Generate unique bet ID
   */
  private static generateBetId(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BET_${timestamp}_${random}`;
  }

  /**
   * Place a new bet
   */
  static async placeBet(betData: {
    gameId: string | number;
    cashierId: string;
    sessionId: string;
    cartelaId: number;
    stake: number;
    betType?: 'single' | 'multiple' | 'combination';
    selectedNumbers?: number[];
    notes?: string;
  }) {
    try {
      // Validate game exists and is in waiting status
      const game = await Game.findOne({ 
        gameId: betData.gameId,
        sessionId: betData.sessionId 
      });

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'waiting') {
        throw new Error('Bets can only be placed when game is in waiting status');
      }

      // Check if cartela is already bet on in this game
      const existingBet = await Bet.findOne({
        gameId: betData.gameId,
        cartelaId: betData.cartelaId,
        betStatus: { $in: ['pending', 'active'] }
      });

      if (existingBet) {
        throw new Error(`Cartela ${betData.cartelaId} is already bet on in this game`);
      }

      // Generate ticket number and create new bet
      const ticketNumber = await this.generateTicketNumber();
      
      const bet = new Bet({
        ticketNumber,
        betId: this.generateBetId(),
        gameId: betData.gameId,
        cashierId: betData.cashierId,
        sessionId: betData.sessionId,
        cartelaId: betData.cartelaId,
        stake: betData.stake,
        betType: betData.betType || 'single',
        betStatus: 'pending',
        gameProgress: game.gameData?.progress || 0,
        selectedNumbers: betData.selectedNumbers || [],
        win: 0, // Initial win amount is 0
        notes: betData.notes,
        isVerified: false
      });

      await bet.save();

      // Update game with new bet information
      await Game.findOneAndUpdate(
        { gameId: betData.gameId, sessionId: betData.sessionId },
        {
          $inc: {
            'gameData.totalStack': betData.stake,
            'gameData.cartelas': 1
          },
          $addToSet: {
            'gameData.placedBetCartelas': betData.cartelaId
          },
          lastActivity: new Date()
        }
      );


      return bet;
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  /**
   * Verify a bet (cashier verification)
   */
  static async verifyBet(betId: string, cashierId: string) {
    try {
      const bet = await Bet.findOne({ betId });

      if (!bet) {
        throw new Error('Bet not found');
      }

      if (bet.isVerified) {
        throw new Error('Bet is already verified');
      }

      // Update bet verification status
      bet.isVerified = true;
      bet.verifiedBy = new mongoose.Types.ObjectId(cashierId);
      bet.verifiedAt = new Date();
      bet.betStatus = 'active';

      await bet.save();


      return bet;
    } catch (error) {
      console.error('Error verifying bet:', error);
      throw error;
    }
  }

  /**
   * Get bet by ticket number
   */
  static async getBetByTicketNumber(ticketNumber: string) {
    try {
      const bet = await Bet.findOne({ ticketNumber });
      return bet;
    } catch (error) {
      console.error('Error getting bet by ticket number:', error);
      throw error;
    }
  }

  /**
   * Get all bets for a specific game
   */
  static async getGameBets(gameId: string | number, sessionId: string) {
    try {
      const bets = await Bet.find({
        gameId,
        sessionId
      }).sort({ placedAt: 1 });

      return bets;
    } catch (error) {
      console.error('Error getting game bets:', error);
      throw error;
    }
  }

  /**
   * Get bet summary for a game
   */
  static async getGameBetSummary(gameId: string | number, sessionId: string) {
    try {
      const bets = await Bet.find({
        gameId,
        sessionId,
        betStatus: { $in: ['pending', 'active'] }
      });

      const summary = {
        totalBets: bets.length,
        totalStake: 0,
        totalCartelas: 0,
        verifiedBets: 0,
        pendingBets: 0,
        betsByType: {
          single: 0,
          multiple: 0,
          combination: 0
        }
      };

      bets.forEach(bet => {
        summary.totalStake += bet.stake;
        summary.totalCartelas += 1;
        
        if (bet.isVerified) {
          summary.verifiedBets++;
        } else {
          summary.pendingBets++;
        }

        summary.betsByType[bet.betType]++;
      });

      return summary;
    } catch (error) {
      console.error('Error getting game bet summary:', error);
      throw error;
    }
  }

  /**
   * Settle bets when game ends
   */
  static async settleGameBets(gameId: string | number, sessionId: string, finalNumbers: number[]) {
    try {
      const activeBets = await Bet.find({
        gameId,
        sessionId,
        betStatus: 'active'
      });

      let totalWinnings = 0;
      const settledBets = [];

      for (const bet of activeBets) {
        // Calculate winnings based on game rules
        const winAmount = this.calculateWinnings(bet, finalNumbers);
        
        bet.betStatus = winAmount > 0 ? 'won' : 'lost';
        bet.settledAt = new Date();

        await bet.save();
        settledBets.push(bet);

        totalWinnings += winAmount;
      }

      // Update game with final winnings
      await Game.findOneAndUpdate(
        { gameId, sessionId },
        {
          $set: {
            'gameData.totalWinStack': totalWinnings,
            'gameData.gameEndTime': new Date()
          },
          lastActivity: new Date()
        }
      );

  
      return {
        totalBets: settledBets.length,
        totalWinnings,
        settledBets
      };
    } catch (error) {
      console.error('Error settling game bets:', error);
      throw error;
    }
  }

  /**
   * Calculate winnings for a bet
   */
  private static calculateWinnings(bet: any, finalNumbers: number[]): number {
    // This is a simplified winning calculation
    // You can implement more complex winning patterns here
    
    if (bet.betType === 'single') {
      // Simple pattern: if cartela has 5 numbers in final numbers, win
      const matchingNumbers = bet.selectedNumbers.filter((num: number) => 
        finalNumbers.includes(num)
      );
      
      if (matchingNumbers.length >= 5) {
        // Calculate winnings based on stake and game rules
        // For now, using a simple 1:1 payout ratio
        return bet.stake;
      }
    }

    return 0; // No win
  }

  /**
   * Cancel a bet
   */
  static async cancelBet(betId: string, cashierId: string, reason?: string) {
    try {
      const bet = await Bet.findOne({ betId });

      if (!bet) {
        throw new Error('Bet not found');
      }

      if (bet.betStatus !== 'pending') {
        throw new Error('Only pending bets can be cancelled');
      }

      bet.betStatus = 'cancelled';
      bet.notes = reason ? `${bet.notes || ''} [Cancelled: ${reason}]` : `${bet.notes || ''} [Cancelled]`;
      bet.settledAt = new Date();

      await bet.save();

      // Refund stake to game total
      await Game.findOneAndUpdate(
        { gameId: bet.gameId, sessionId: bet.sessionId },
        {
          $inc: {
            'gameData.totalStack': -bet.stake,
            'gameData.cartelas': -1
          },
          $pull: {
            'gameData.placedBetCartelas': bet.cartelaId
          },
          lastActivity: new Date()
        }
      );

      // CRITICAL: Recalculate all financial fields after cancellation
      try {
        const { GameAggregationService } = await import('./gameAggregationService');
        
                 // Use the existing method to update game with aggregated data
         const updatedGame = await GameAggregationService.updateGameWithAggregatedData(bet.sessionId, bet.gameId.toString());
        
      } catch (aggregationError) {
        // Don't fail the cancellation if aggregation fails
      }

      return bet;
    } catch (error) {
      console.error('Error cancelling bet:', error);
      throw error;
    }
  }

  /**
   * Get bet statistics for reporting
   */
  static async getBetStatistics(startDate: Date, endDate: Date, cashierId?: string) {
    try {
      const matchStage: any = {
        placedAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      if (cashierId) {
        matchStage.cashierId = cashierId;
      }

      const stats = await Bet.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalBets: { $sum: 1 },
            totalStake: { $sum: '$stake' },
            averageStake: { $avg: '$stake' },
            betsByStatus: {
              $push: '$betStatus'
            },
            betsByType: {
              $push: '$betType'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalBets: 0,
          totalStake: 0,
          totalWinnings: 0,
          averageStake: 0,
          netProfit: 0,
          betsByStatus: {},
          betsByType: {}
        };
      }

      const stat = stats[0];
      // Note: totalWinnings is now 0 since it's calculated at game level, not bet level
      const totalWinnings = 0;
      const netProfit = totalWinnings - stat.totalStake;

      // Count statuses
      const statusCounts = stat.betsByStatus.reduce((acc: any, status: string) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Count types
      const typeCounts = stat.betsByType.reduce((acc: any, type: string) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      return {
        totalBets: stat.totalBets,
        totalStake: stat.totalStake,
        totalWinnings: stat.totalWinnings,
        averageStake: Math.round(stat.averageStake * 100) / 100,
        netProfit,
        betsByStatus: statusCounts,
        betsByType: typeCounts
      };
    } catch (error) {
      console.error('Error getting bet statistics:', error);
      throw error;
    }
  }
}
