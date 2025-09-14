/**
 * NEW Game ID Service - Manages 4-digit game ID generation (4000-4999)
 *
 * Features:
 * - 4-digit game IDs from 4000 to 4999
 * - Daily reset to 4000 for each cashier
 * - Sequential incrementing within the same day
 * - Date & time stamps for easy identification
 * - Thread-safe game ID generation
 * - Performance optimized with minimal database calls
 * - Prevents game ID duplication
 * - Ensures continuity after server restarts
 */
export declare class GameIdService {
    private static gameIdCache;
    private static readonly CACHE_TTL;
    private static readonly MIN_GAME_ID;
    private static readonly MAX_GAME_ID;
    /**
     * Get the current game ID for a cashier
     * If it's a new day, reset to 4000
     *
     * @param cashierId - The cashier's unique identifier
     * @returns Promise<number> - The current game ID
     * @throws Error if cashier not found or database error
     */
    static getCurrentGameId(cashierId: string): Promise<number>;
    /**
     * Get the next available game ID for a cashier
     * This returns the next available game ID without changing the cashier's currentGameId
     *
     * @param cashierId - The cashier's unique identifier
     * @returns Promise<number> - The next available game ID
     * @throws Error if cashier not found or database error
     */
    static getNextGameId(cashierId: string): Promise<number>;
    /**
     * Reset game ID to 4000 for a cashier (for testing or manual reset)
     *
     * @param cashierId - The cashier's unique identifier
     * @returns Promise<number> - The reset game ID
     */
    static resetGameId(cashierId: string): Promise<number>;
    /**
     * CRITICAL FIX: Synchronize Game ID Service with current database state
     * This ensures the service returns the correct next available game ID
     *
     * @param cashierId - The cashier's unique identifier
     * @returns Promise<number> - The synchronized next available game ID
     */
    static synchronizeWithDatabase(cashierId: string): Promise<number>;
    /**
     * Get comprehensive game ID info for a cashier
     *
     * @param cashierId - The cashier's unique identifier
     * @returns Promise<GameIdInfo> - Game ID information
     */
    static getGameIdInfo(cashierId: string): Promise<{
        currentGameId: number;
        lastGameDate: Date | null;
        isNewDay: boolean;
        cashierName: string;
        nextAvailableGameId: number;
        totalGamesToday: number;
    }>;
    /**
     * Clear the game ID cache (useful for testing or manual cache management)
     */
    static clearCache(): void;
    /**
     * Increment game ID for the next game (called when a game is completed)
     *
     * @param cashierId - The cashier's unique identifier
     * @returns Promise<number> - The next game ID
     * @throws Error if cashier not found or database error
     */
    static incrementGameIdForNextGame(cashierId: string): Promise<number>;
    /**
     * Get information about the next game that will be created
     *
     * @param cashierId - The cashier's unique identifier
     * @returns Promise<NextGameInfo> - Information about the next game
     */
    static getNextGameInfo(cashierId: string): Promise<{
        nextGameId: number;
        isNewDay: boolean;
        cashierName: string;
        lastGameDate: Date | null;
        totalGamesToday: number;
        estimatedNextGameTime: Date;
    }>;
    /**
     * Validate and ensure game ID is within valid range (4000-4999)
     * Prevents invalid game IDs and ensures 4-digit format
     *
     * @param gameId - The game ID to validate
     * @returns number - Validated and normalized game ID
     */
    private static validateAndNormalizeGameId;
    /**
     * Find the next available game ID to prevent duplication
     *
     * @param cashierId - The cashier's unique identifier
     * @param today - The start of today's date
     * @returns Promise<number> - Next available game ID
     */
    private static findNextAvailableGameId;
    /**
     * Count total games today for a cashier
     *
     * @param cashierId - The cashier's unique identifier
     * @param today - The start of today's date
     * @returns Promise<number> - Total games today
     */
    private static countGamesToday;
    /**
     * Initialize game ID service on server startup
     * Ensures continuity after server restarts
     *
     * @returns Promise<void>
     */
    static initializeService(): Promise<void>;
    /**
     * Get cashier with validation
     */
    private static getCashierWithValidation;
    /**
     * Check if game ID should be reset for a new day
     */
    private static shouldResetGameId;
    /**
     * Reset game ID for a new day
     */
    private static resetGameIdForNewDay;
    /**
     * Check if two dates are the same day
     */
    private static isSameDay;
    /**
     * Get start of day (midnight) for a given date
     */
    private static getStartOfDay;
    /**
     * Get game ID from cache if valid
     */
    private static getFromCache;
    /**
     * Update game ID cache
     */
    private static updateCache;
}
//# sourceMappingURL=gameIdService.d.ts.map