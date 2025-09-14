import { EventEmitter } from 'events';
import GameService from './gameService';
export interface AutoDrawConfig {
    enabled: boolean;
    interval: number;
}
export interface AutoDrawStats {
    isActive: boolean;
    totalDraws: number;
    successfulDraws: number;
    failedDraws: number;
    averageDrawTime: number;
    lastDrawTime?: Date;
    nextDrawTime?: Date;
    performanceScore: number;
    errors: Array<{
        timestamp: Date;
        error: string;
    }>;
}
export declare class AutoDrawController extends EventEmitter {
    private cashierControllers;
    private gameService;
    private defaultConfig;
    constructor(gameService: GameService);
    /**
     * Initialize auto draw controller for a specific cashier
     */
    initializeCashierController(cashierId: string, sessionId: string, config?: Partial<AutoDrawConfig>): void;
    /**
     * Start auto draw for a specific cashier
     */
    startAutoDraw(cashierId: string, sessionId: string): Promise<boolean>;
    /**
     * Stop auto draw for a specific cashier
     */
    stopAutoDraw(cashierId: string): boolean;
    /**
     * Perform the actual auto draw operation
     */
    private performAutoDraw;
    /**
   * Update configuration for a specific cashier
   */
    updateCashierConfig(cashierId: string, newConfig: Partial<AutoDrawConfig>, sessionId: string): boolean;
    /**
     * Get auto draw statistics for a specific cashier
     */
    getCashierStats(cashierId: string): AutoDrawStats | null;
    /**
     * Get all active cashier controllers
     */
    getActiveControllers(): string[];
    /**
     * Clean up controller for a specific cashier
     */
    cleanupCashierController(cashierId: string): void;
    /**
     * Get global auto draw statistics
     */
    getGlobalStats(): {
        activeControllers: number;
        totalDraws: number;
        totalErrors: number;
        averagePerformanceScore: number;
    };
}
//# sourceMappingURL=autoDrawController.d.ts.map