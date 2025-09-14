import { Server } from 'socket.io';
import Game from '../models/Game';
import { GameAggregationService } from './gameAggregationService';

/**
 * Enhanced Real-Time Update Service
 * 
 * Features:
 * - Immediate real-time updates (no delays)
 * - Page refresh capabilities
 * - Optimized data transmission
 * - Batch updates for better performance
 */
export class RealTimeUpdateService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * IMMEDIATE real-time update - fastest possible update
   * Updates game data and emits to all connected clients instantly
   */
  async updateGameDataImmediate(sessionId: string, gameId?: string): Promise<void> {
    try {
      
      // If no gameId provided, try to get it from the database
      let actualGameId = gameId;
      if (!actualGameId) {
        const Game = (await import('../models/Game')).default;
        const game = await Game.findOne({ sessionId });
        if (game) {
          actualGameId = game.gameId;
        } else {
          console.error(`❌ No game found for session ${sessionId}, cannot update data`);
          return;
        }
      }
      
      // Validate gameId is available
      if (!actualGameId) {
        console.error(`❌ No gameId available for session ${sessionId}, cannot update data`);
        return;
      }
      
      // Get latest aggregated data
      const updatedGame = await GameAggregationService.updateGameWithAggregatedData(sessionId, actualGameId);
      
      if (!updatedGame) {
        return;
      }

      // IMMEDIATE emit to all connected clients (no delays)
      this.emitGameDataUpdateImmediate(sessionId, updatedGame);
      
  
    } catch (error) {
      console.error(`❌ Error in immediate update for session ${sessionId}:`, error);
    }
  }

  /**
   * Emit game data update IMMEDIATELY to all clients
   * No delays, instant transmission
   */
  private emitGameDataUpdateImmediate(sessionId: string, game: any): void {
    const gameData = game.gameData || {};
    
    // Prepare optimized data payload
    const updatePayload = {
      sessionId,
      gameId: game.gameId,
      timestamp: new Date(),
      data: {
        cartelas: gameData.cartelas || 0,
        totalStack: gameData.totalStack || 0,
        totalWinStack: gameData.totalWinStack || 0,
        totalShopMargin: gameData.totalShopMargin || 0,
        totalSystemFee: gameData.totalSystemFee || 0,
        netPrizePool: gameData.netPrizePool || 0,
        placedBetCartelas: gameData.placedBetCartelas || [],
        progress: gameData.progress || 0,
        calledNumbers: gameData.calledNumbers || [],
        currentNumber: gameData.currentNumber || null,
        status: game.status || 'waiting'
      }
    };

    // IMMEDIATE emit to all connected clients
    this.io.to(`game:${sessionId}`).emit('game_data_updated_immediate', updatePayload);
    this.io.to(`display:${sessionId}`).emit('game_data_updated_immediate', updatePayload);
    this.io.to(`cashier:${game.cashierId}`).emit('game_data_updated_immediate', updatePayload);
    
   
  }

  /**
   * Force page refresh for all connected clients
   * Useful when major changes occur
   */
  forcePageRefresh(sessionId: string, reason: string = 'Data update'): void {
    const refreshPayload = {
      sessionId,
      reason,
      timestamp: new Date(),
      forceRefresh: true
    };

    // Emit to all connected clients
    this.io.to(`game:${sessionId}`).emit('force_page_refresh', refreshPayload);
    this.io.to(`display:${sessionId}`).emit('force_page_refresh', refreshPayload);
    this.io.to(`cashier:*`).emit('force_page_refresh', refreshPayload);
    
  }

  /**
   * Smart update - chooses between immediate and delayed based on data size
   */
  async smartUpdate(sessionId: string, gameId?: string): Promise<void> {
    try {
      const game = await Game.findOne({ sessionId });
      if (!game) return;

      const gameData = game.gameData || {};
      const dataSize = JSON.stringify(gameData).length;

      // For small updates (< 1KB), use immediate update
      if (dataSize < 1024) {
        await this.updateGameDataImmediate(sessionId, gameId || game.gameId);
      } else {
        // For large updates, use optimized batch update
        await this.updateGameDataOptimized(sessionId, gameId || game.gameId);
      }
    } catch (error) {
      console.error(`❌ Error in smart update for session ${sessionId}:`, error);
    }
  }

  /**
   * Optimized update for large data sets
   * Compresses data and batches updates
   */
  private async updateGameDataOptimized(sessionId: string, gameId?: string): Promise<void> {
    try {
      
      // If no gameId provided, try to get it from the database
      let actualGameId = gameId;
      if (!actualGameId) {
        const Game = (await import('../models/Game')).default;
        const game = await Game.findOne({ sessionId });
        if (game) {
          actualGameId = game.gameId;
        } else {
          console.error(`❌ No game found for session ${sessionId}, cannot update data`);
          return;
        }
      }
      
      // Validate gameId is available
      if (!actualGameId) {
        console.error(`❌ No gameId available for session ${sessionId}, cannot update data`);
        return;
      }
      
      const updatedGame = await GameAggregationService.updateGameWithAggregatedData(sessionId, actualGameId);
      
      if (!updatedGame) return;

      // Create compressed payload
      const compressedPayload = this.createCompressedPayload(updatedGame);
      
      // Emit compressed data
      this.io.to(`game:${sessionId}`).emit('game_data_updated_optimized', compressedPayload);
      this.io.to(`display:${sessionId}`).emit('game_data_updated_optimized', compressedPayload);
      this.io.to(`cashier:${updatedGame.cashierId}`).emit('game_data_updated_optimized', compressedPayload);
      
    } catch (error) {
      console.error(`❌ Error in optimized update for session ${sessionId}:`, error);
    }
  }

  /**
   * Create compressed payload for large data sets
   */
  private createCompressedPayload(game: any): any {
    const gameData = game.gameData || {};
    
    return {
      sessionId: game.sessionId,
      gameId: game.gameId,
      timestamp: new Date(),
      // Only essential data for performance
      essential: {
        cartelas: gameData.cartelas || 0,
        totalStack: gameData.totalStack || 0,
        totalWinStack: gameData.totalWinStack || 0,
        totalShopMargin: gameData.totalShopMargin || 0,
        totalSystemFee: gameData.totalSystemFee || 0,
        netPrizePool: gameData.netPrizePool || 0,
        progress: gameData.progress || 0,
        status: game.status || 'waiting'
      },
      // Full data available on request
      hasFullData: true
    };
  }

  /**
   * Batch update multiple sessions at once
   * For better performance when updating multiple games
   */
  async batchUpdateSessions(sessionIds: string[]): Promise<void> {
    try {
      
      const updatePromises = sessionIds.map(sessionId => 
        this.updateGameDataImmediate(sessionId)
      );
      
      await Promise.all(updatePromises);
      
    } catch (error) {
      console.error('❌ Error in batch update:', error);
    }
  }

  /**
   * Emit connection status update with real-time data
   */
  emitConnectionStatusUpdate(sessionId: string, connectionData: any): void {
    const statusPayload = {
      sessionId,
      timestamp: new Date(),
      ...connectionData
    };

    // Immediate emit to all clients
    this.io.to(`game:${sessionId}`).emit('connection_status_updated', statusPayload);
    this.io.to(`display:${sessionId}`).emit('connection_status_updated', statusPayload);
    this.io.to(`cashier:*`).emit('connection_status_updated', statusPayload);
  }

  /**
   * Emit game status change with immediate update
   */
  emitGameStatusChange(sessionId: string, newStatus: string, gameData?: any): void {
    const statusPayload = {
      sessionId,
      newStatus,
      timestamp: new Date(),
      gameData: gameData || {}
    };

    // Immediate emit
    this.io.to(`game:${sessionId}`).emit('game_status_changed', statusPayload);
    this.io.to(`display:${sessionId}`).emit('game_status_changed', statusPayload);
    this.io.to(`cashier:*`).emit('game_status_changed', statusPayload);
  }

  /**
   * Emit financial update with real-time totals
   */
  emitFinancialUpdate(sessionId: string, financialData: any): void {
    const financialPayload = {
      sessionId,
      timestamp: new Date(),
      financial: {
        totalStack: financialData.totalStack || 0,
        totalShopMargin: financialData.totalShopMargin || 0,
        totalSystemFee: financialData.totalSystemFee || 0,
        netPrizePool: financialData.netPrizePool || 0,
        cartelas: financialData.cartelas || 0
      }
    };

    // Immediate emit to all clients
    this.io.to(`game:${sessionId}`).emit('financial_data_updated', financialPayload);
    this.io.to(`display:${sessionId}`).emit('financial_data_updated', financialPayload);
    this.io.to(`cashier:*`).emit('financial_data_updated', financialPayload);
  }

  /**
   * Emit placed bets update with real-time data
   */
  emitPlacedBetsUpdate(sessionId: string, placedBets: number[], gameId?: string): void {
    const betsPayload = {
      sessionId,
      gameId,
      timestamp: new Date(),
      placedBetCartelas: placedBets,
      totalBets: placedBets.length
    };

    // Immediate emit
    this.io.to(`game:${sessionId}`).emit('placed_bets_updated', betsPayload);
    this.io.to(`display:${sessionId}`).emit('placed_bets_updated', betsPayload);
    this.io.to(`cashier:*`).emit('placed_bets_updated', betsPayload);
  }

  /**
   * Emit game end with immediate data refresh
   */
  emitGameEnd(sessionId: string, gameData: any): void {
    const endPayload = {
      sessionId,
      gameId: gameData.gameId,
      timestamp: new Date(),
      finalData: {
        cartelas: gameData.cartelas || 0,
        totalStack: gameData.totalStack || 0,
        totalWinStack: gameData.totalWinStack || 0,
        totalShopMargin: gameData.totalShopMargin || 0,
        totalSystemFee: gameData.totalSystemFee || 0,
        netPrizePool: gameData.netPrizePool || 0,
        progress: gameData.progress || 0
      },
      forceRefresh: true // Force page refresh on game end
    };

    // Immediate emit with force refresh
    this.io.to(`game:${sessionId}`).emit('game_ended_with_refresh', endPayload);
    this.io.to(`display:${sessionId}`).emit('game_ended_with_refresh', endPayload);
    this.io.to(`cashier:*`).emit('game_ended_with_refresh', endPayload);
  }
}

export default RealTimeUpdateService;
