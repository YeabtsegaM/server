import CompletedGame from '../models/CompletedGame';

/**
 * Financial Reporting Utility for Completed Games
 * Now that we archive aggregated financial data, reporting is much easier!
 */
export class FinancialReportingUtility {
  
  /**
   * Get financial summary for a specific cashier
   */
  static async getCashierFinancialSummary(cashierId: string, startDate?: Date, endDate?: Date) {
    try {
      const query: any = { cashierId };
      
      if (startDate || endDate) {
        query['gameData.completedAt'] = {};
        if (startDate) query['gameData.completedAt'].$gte = startDate;
        if (endDate) query['gameData.completedAt'].$lte = endDate;
      }
      
      const completedGames = await CompletedGame.find(query).sort({ 'gameData.completedAt': -1 });
      
      const summary = {
        totalGames: completedGames.length,
        totalStakes: 0,
        totalShopMargins: 0,
        totalSystemFees: 0,
        totalNetPrizePools: 0,
        averageStakePerGame: 0,
        averageShopMarginPerGame: 0,
        averageSystemFeePerGame: 0,
        averageNetPrizePoolPerGame: 0,
        games: completedGames.map(game => ({
          gameId: game.gameId,
          completedAt: game.gameData.completedAt,
          cartelas: game.gameData.finalCartelas,
          totalStack: game.gameData.finalTotalStack,
          totalShopMargin: game.gameData.finalTotalShopMargin,
          totalSystemFee: game.gameData.finalTotalSystemFee,
          netPrizePool: game.gameData.finalNetPrizePool
        }))
      };
      
      // Calculate totals
      completedGames.forEach(game => {
        summary.totalStakes += game.gameData.finalTotalStack || 0;
        summary.totalShopMargins += game.gameData.finalTotalShopMargin || 0;
        summary.totalSystemFees += game.gameData.finalTotalSystemFee || 0;
        summary.totalNetPrizePools += game.gameData.finalNetPrizePool || 0;
      });
      
      // Calculate averages
      if (summary.totalGames > 0) {
        summary.averageStakePerGame = summary.totalStakes / summary.totalGames;
        summary.averageShopMarginPerGame = summary.totalShopMargins / summary.totalGames;
        summary.averageSystemFeePerGame = summary.totalSystemFees / summary.totalGames;
        summary.averageNetPrizePoolPerGame = summary.totalNetPrizePools / summary.totalGames;
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating cashier financial summary:', error);
      throw error;
    }
  }
  
  /**
   * Get daily financial summary
   */
  static async getDailyFinancialSummary(date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const completedGames = await CompletedGame.find({
        'gameData.completedAt': { $gte: startOfDay, $lte: endOfDay }
      }).sort({ 'gameData.completedAt': -1 });
      
      const summary = {
        date: startOfDay,
        totalGames: completedGames.length,
        totalStakes: 0,
        totalShopMargins: 0,
        totalSystemFees: 0,
        totalNetPrizePools: 0,
        games: completedGames.map(game => ({
          gameId: game.gameId,
          cashierId: game.cashierId,
          completedAt: game.gameData.completedAt,
          cartelas: game.gameData.finalCartelas,
          totalStack: game.gameData.finalTotalStack,
          totalShopMargin: game.gameData.finalTotalShopMargin,
          totalSystemFee: game.gameData.finalTotalSystemFee,
          netPrizePool: game.gameData.finalNetPrizePool
        }))
      };
      
      // Calculate totals
      completedGames.forEach(game => {
        summary.totalStakes += game.gameData.finalTotalStack || 0;
        summary.totalShopMargins += game.gameData.finalTotalShopMargin || 0;
        summary.totalSystemFees += game.gameData.finalTotalSystemFee || 0;
        summary.totalNetPrizePools += game.gameData.finalNetPrizePool || 0;
      });
      
      return summary;
    } catch (error) {
      console.error('Error generating daily financial summary:', error);
      throw error;
    }
  }
  
  /**
   * Get top performing games by total stake
   */
  static async getTopGamesByStake(limit: number = 10) {
    try {
      const topGames = await CompletedGame.find({})
        .sort({ 'gameData.finalTotalStack': -1 })
        .limit(limit)
        .select('gameId cashierId gameData.finalTotalStack gameData.finalCartelas gameData.completedAt');
      
      return topGames.map(game => ({
        gameId: game.gameId,
        cashierId: game.cashierId,
        totalStake: game.gameData.finalTotalStack,
        cartelas: game.gameData.finalCartelas,
        completedAt: game.gameData.completedAt
      }));
    } catch (error) {
      console.error('Error getting top games by stake:', error);
      throw error;
    }
  }
  
  /**
   * Get financial performance over time (for charts)
   */
  static async getFinancialPerformanceOverTime(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' = 'day') {
    try {
      const completedGames = await CompletedGame.find({
        'gameData.completedAt': { $gte: startDate, $lte: endDate }
      }).sort({ 'gameData.completedAt': 1 });
      
      // Group by time period
      const groupedData: any = {};
      
      completedGames.forEach(game => {
        let key: string;
        const date = new Date(game.gameData.completedAt);
        
        switch (groupBy) {
          case 'day':
            key = date.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            break;
          default:
            key = date.toISOString().split('T')[0];
        }
        
        if (!groupedData[key]) {
          groupedData[key] = {
            period: key,
            totalStakes: 0,
            totalShopMargins: 0,
            totalSystemFees: 0,
            totalNetPrizePools: 0,
            gameCount: 0
          };
        }
        
        groupedData[key].totalStakes += game.gameData.finalTotalStack || 0;
        groupedData[key].totalShopMargins += game.gameData.finalTotalShopMargin || 0;
        groupedData[key].totalSystemFees += game.gameData.finalTotalSystemFee || 0;
        groupedData[key].totalNetPrizePools += game.gameData.finalNetPrizePool || 0;
        groupedData[key].gameCount += 1;
      });
      
      return Object.values(groupedData);
    } catch (error) {
      console.error('Error getting financial performance over time:', error);
      throw error;
    }
  }
}

export default FinancialReportingUtility;
