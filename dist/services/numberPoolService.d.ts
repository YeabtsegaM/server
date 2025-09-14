import { EventEmitter } from 'events';
export interface NumberPoolConfig {
    minNumber: number;
    maxNumber: number;
    autoShuffle: boolean;
    shuffleThreshold: number;
}
export interface NumberPoolStats {
    totalNumbers: number;
    drawnNumbers: number;
    remainingNumbers: number;
    lastDrawTime?: Date;
    drawCount: number;
    averageDrawTime: number;
}
export declare class NumberPoolService extends EventEmitter {
    private cashierPools;
    private defaultConfig;
    private readonly POOL_SIZE;
    constructor();
    /**
     * Initialize or reset number pool for a specific cashier
     */
    initializeCashierPool(cashierId: string, config?: Partial<NumberPoolConfig>): void;
    /**
     * Draw a random number for a specific cashier
     */
    drawNumber(cashierId: string): number | null;
    /**
     * Shuffle the pool for a specific cashier (puts all numbers back)
     */
    shuffleCashierPool(cashierId: string): void;
    /**
     * Get pool statistics for a specific cashier
     */
    getCashierPoolStats(cashierId: string): NumberPoolStats | null;
    /**
     * Get remaining numbers for a specific cashier
     */
    getRemainingNumbers(cashierId: string): number[];
    /**
     * Get drawn numbers for a specific cashier
     */
    getDrawnNumbers(cashierId: string): number[];
    /**
     * Check if a number is available for a specific cashier
     */
    isNumberAvailable(cashierId: string, number: number): boolean;
    /**
     * Clean up pool for a specific cashier (when they disconnect)
     */
    cleanupCashierPool(cashierId: string): void;
    /**
     * Get all active cashier IDs
     */
    getActiveCashierIds(): string[];
    /**
     * Get global statistics across all cashiers
     */
    getGlobalStats(): {
        activeCashiers: number;
        totalNumbersDrawn: number;
        averageDrawTime: number;
    };
    /**
     * Sync pool with actual game state (called numbers)
     */
    syncPoolWithGameState(cashierId: string, calledNumbers: number[]): void;
}
export declare const numberPoolService: NumberPoolService;
//# sourceMappingURL=numberPoolService.d.ts.map