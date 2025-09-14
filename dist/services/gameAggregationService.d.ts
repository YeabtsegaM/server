export declare class GameAggregationService {
    /**
     * Aggregate all bet data for a specific game session
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID (REQUIRED to prevent data contamination)
     * @returns Aggregated game data with financial totals
     */
    static aggregateGameData(sessionId: string, gameId: string): Promise<{
        cartelas: number;
        stack: number;
        totalStack: number;
        totalShopMargin: number;
        totalSystemFee: number;
        netPrizePool: number;
        totalWinStack: number;
        netShopProfit: number;
        placedBetCartelas: number[];
    }>;
    /**
     * Update game document with aggregated bet data
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID (REQUIRED to prevent data contamination)
     * @returns Updated game document
     */
    static updateGameWithAggregatedData(sessionId: string, gameId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Game").IGame, {}> & import("../models/Game").IGame & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Get real-time game data with latest aggregated bet information
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID (REQUIRED to prevent data contamination)
     * @returns Complete game data with real-time totals
     */
    static getRealTimeGameData(sessionId: string, gameId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Game").IGame, {}> & import("../models/Game").IGame & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Move completed game to completedgames collection with full aggregated data
     * @param sessionId - The game session ID
     * @param gameId - The specific game ID
     * @returns Created CompletedGame document
     */
    static moveGameToCompleted(sessionId: string, gameId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/CompletedGame").ICompletedGame, {}> & import("../models/CompletedGame").ICompletedGame & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * RECOVERY FUNCTION: Fix all corrupted games in completedgames collection
     * This function will re-aggregate financial data for games that were corrupted
     * @returns Number of games fixed
     */
    static recoverCorruptedCompletedGames(): Promise<number>;
}
export default GameAggregationService;
//# sourceMappingURL=gameAggregationService.d.ts.map