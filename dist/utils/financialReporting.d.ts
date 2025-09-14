/**
 * Financial Reporting Utility for Completed Games
 * Now that we archive aggregated financial data, reporting is much easier!
 */
export declare class FinancialReportingUtility {
    /**
     * Get financial summary for a specific cashier
     */
    static getCashierFinancialSummary(cashierId: string, startDate?: Date, endDate?: Date): Promise<{
        totalGames: number;
        totalStakes: number;
        totalShopMargins: number;
        totalSystemFees: number;
        totalNetPrizePools: number;
        averageStakePerGame: number;
        averageShopMarginPerGame: number;
        averageSystemFeePerGame: number;
        averageNetPrizePoolPerGame: number;
        games: {
            gameId: string | number;
            completedAt: Date;
            cartelas: number;
            totalStack: number;
            totalShopMargin: number;
            totalSystemFee: number;
            netPrizePool: number;
        }[];
    }>;
    /**
     * Get daily financial summary
     */
    static getDailyFinancialSummary(date: Date): Promise<{
        date: Date;
        totalGames: number;
        totalStakes: number;
        totalShopMargins: number;
        totalSystemFees: number;
        totalNetPrizePools: number;
        games: {
            gameId: string | number;
            cashierId: import("mongoose").Types.ObjectId;
            completedAt: Date;
            cartelas: number;
            totalStack: number;
            totalShopMargin: number;
            totalSystemFee: number;
            netPrizePool: number;
        }[];
    }>;
    /**
     * Get top performing games by total stake
     */
    static getTopGamesByStake(limit?: number): Promise<{
        gameId: string | number;
        cashierId: import("mongoose").Types.ObjectId;
        totalStake: number;
        cartelas: number;
        completedAt: Date;
    }[]>;
    /**
     * Get financial performance over time (for charts)
     */
    static getFinancialPerformanceOverTime(startDate: Date, endDate: Date, groupBy?: 'day' | 'week' | 'month'): Promise<unknown[]>;
}
export default FinancialReportingUtility;
//# sourceMappingURL=financialReporting.d.ts.map