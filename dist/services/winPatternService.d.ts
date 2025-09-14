import { ICartela } from '../models/Cartela';
export interface PatternMatchResult {
    isWinner: boolean;
    matchedPatterns: string[];
    matchedNumbers: number[];
    matchTimestamp: Date;
    patternNames: string[];
    allMatchedPatterns: Array<{
        patternId: string;
        patternName: string;
        matchedNumbers: number[];
    }>;
}
export declare class WinPatternService {
    private static patternCache;
    private static cacheExpiry;
    private static CACHE_TTL;
    /**
     * Get cached active win patterns for a cashier
     */
    private static getCachedPatterns;
    /**
     * Convert 2D cartela pattern to flat array of numbers
     */
    private static cartelaPatternToNumbers;
    /**
     * High-performance pattern matching for a single cartela
     * Now supports multiple active patterns and returns all matches
     */
    static checkCartelaWin(cartela: ICartela, drawnNumbers: number[], cashierId: string): Promise<PatternMatchResult>;
    /**
     * Efficient pattern matching algorithm
     */
    private static matchPattern;
    /**
     * Batch check multiple cartelas for performance
     */
    static checkMultipleCartelas(cartelas: ICartela[], drawnNumbers: number[], cashierId: string): Promise<Map<string, PatternMatchResult>>;
    /**
     * Clear cache for a specific cashier (when patterns change)
     */
    static clearCache(cashierId: string): void;
    /**
     * Clear all caches (for maintenance)
     */
    static clearAllCaches(): void;
}
export default WinPatternService;
//# sourceMappingURL=winPatternService.d.ts.map