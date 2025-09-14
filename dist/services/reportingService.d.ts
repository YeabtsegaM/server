/**
 * Reporting Service - Provides analytics and reporting on completed games
 *
 * This service demonstrates how to use the archived game data for:
 * - Game performance analytics
 * - Cashier performance reports
 * - Revenue tracking
 * - Game statistics
 */
export declare class ReportingService {
    /**
     * Get game performance summary for a specific date range
     */
    static getGamePerformanceSummary(startDate: Date, endDate: Date): Promise<{
        totalGames: number;
        totalRevenue: number;
        totalWinnings: number;
        averageProgress: number;
        totalCartelas: number;
        gamesByCashier: Map<any, any>;
        gamesByStatus: Map<any, any>;
        revenueByDay: Map<any, any>;
    }>;
    /**
     * Get cashier performance report
     */
    static getCashierPerformanceReport(cashierId: string, startDate: Date, endDate: Date): Promise<{
        cashierId: string;
        totalGames: number;
        totalRevenue: number;
        totalWinnings: number;
        averageProgress: number;
        games: {
            gameId: string | number;
            completedAt: Date;
            progress: number;
            revenue: number;
            winnings: number;
            cartelas: number;
            calledNumbers: number;
        }[];
    }>;
    /**
     * Get game statistics for a specific game ID
     */
    static getGameStatistics(gameId: string | number): Promise<{
        gameId: string | number;
        cashier: any;
        sessionId: string;
        startTime: Date | undefined;
        endTime: Date | undefined;
        duration: number | null;
        progress: number;
        calledNumbers: number[];
        drawHistory: {
            number: number;
            timestamp: Date;
            type: string;
        }[];
        selectedCartelas: number[];
        placedBetCartelas: number[];
        totalStack: number;
        totalWinStack: number;
        winPatterns: any[];
        completedAt: Date;
    } | null>;
    /**
     * Get revenue trends over time
     */
    static getRevenueTrends(startDate: Date, endDate: Date, groupBy?: 'day' | 'week' | 'month'): Promise<any[]>;
    /**
     * Get financial metrics and profit analysis
     */
    static getFinancialMetrics(startDate: Date, endDate: Date): Promise<{
        totalRevenue: number;
        totalWinnings: number;
        totalSystemFees: number;
        totalShopProfit: number;
        netProfit: number;
        profitMargin: number;
        averageBetSize: number;
        totalBets: number;
        revenueByDay: Map<any, any>;
        profitByDay: Map<any, any>;
    }>;
    /**
     * Get top performing cashiers
     */
    static getTopPerformingCashiers(limit?: number, startDate?: Date, endDate?: Date): Promise<{
        cashierId: any;
        cashierName: string;
        username: string;
        totalGames: any;
        totalRevenue: any;
        totalWinnings: any;
        averageProgress: number;
    }[]>;
}
//# sourceMappingURL=reportingService.d.ts.map