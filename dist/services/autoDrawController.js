"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoDrawController = void 0;
const events_1 = require("events");
const numberPoolService_1 = require("./numberPoolService");
class AutoDrawController extends events_1.EventEmitter {
    constructor(gameService) {
        super();
        this.cashierControllers = new Map();
        this.defaultConfig = {
            enabled: false,
            interval: 5000 // Fixed at 5000ms (5 seconds) - no more adjustable range
        };
        this.gameService = gameService;
    }
    /**
     * Initialize auto draw controller for a specific cashier
     */
    initializeCashierController(cashierId, sessionId, config) {
        const fullConfig = { ...this.defaultConfig, ...config };
        this.cashierControllers.set(cashierId, {
            config: fullConfig,
            stats: {
                isActive: false,
                totalDraws: 0,
                successfulDraws: 0,
                failedDraws: 0,
                averageDrawTime: 0,
                performanceScore: 0,
                lastDrawTime: undefined,
                nextDrawTime: undefined,
                errors: []
            },
            interval: null,
            isActive: false,
            isProcessing: false, // Initialize processing flag
            lastDrawTime: Date.now()
        });
        // Initialize number pool for this cashier
        numberPoolService_1.numberPoolService.initializeCashierPool(cashierId);
        this.emit('controller_initialized', { cashierId, sessionId, config: fullConfig });
    }
    /**
     * Start auto draw for a specific cashier
     */
    async startAutoDraw(cashierId, sessionId) {
        const controller = this.cashierControllers.get(cashierId);
        if (!controller) {
            return false;
        }
        if (controller.isActive) {
            return false;
        }
        try {
            // Verify game is active
            const game = await this.gameService.getGameData(sessionId);
            if (!game || game.status !== 'active') {
                return false;
            }
            controller.isActive = true;
            controller.stats.isActive = true;
            controller.lastDrawTime = Date.now();
            // Set initial next draw time - ensure it's exactly interval milliseconds from now
            const now = Date.now();
            controller.stats.nextDrawTime = new Date(now + controller.config.interval);
            // Start the auto draw interval with precise timing
            controller.interval = setInterval(async () => {
                // Only perform draw if still active and not already processing
                if (controller.isActive && !controller.isProcessing) {
                    await this.performAutoDraw(cashierId, sessionId);
                }
            }, controller.config.interval);
            this.emit('auto_draw_started', { cashierId, sessionId, config: controller.config });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Stop auto draw for a specific cashier
     */
    stopAutoDraw(cashierId) {
        const controller = this.cashierControllers.get(cashierId);
        if (!controller) {
            return false;
        }
        if (controller.interval) {
            clearInterval(controller.interval);
            controller.interval = null;
        }
        controller.isActive = false;
        controller.isProcessing = false; // Reset processing flag
        controller.stats.isActive = false;
        controller.stats.nextDrawTime = undefined;
        this.emit('auto_draw_stopped', { cashierId });
        return true;
    }
    /**
     * Perform the actual auto draw operation
     */
    async performAutoDraw(cashierId, sessionId) {
        const controller = this.cashierControllers.get(cashierId);
        if (!controller || !controller.isActive)
            return;
        // Prevent duplicate calls
        if (controller.isProcessing) {
            return;
        }
        controller.isProcessing = true;
        const startTime = Date.now();
        try {
            // Check if game is still active
            const game = await this.gameService.getGameData(sessionId);
            if (!game) {
                this.stopAutoDraw(cashierId);
                return;
            }
            // Check if all 75 numbers have been drawn
            const calledNumbers = game.gameData?.calledNumbers || [];
            if (calledNumbers.length >= 75) {
                // Stop auto draw (don't change game status - let other systems handle it)
                this.stopAutoDraw(cashierId);
                // Emit game completion event
                this.emit('game_completed', {
                    cashierId,
                    sessionId,
                    finalProgress: 75,
                    gameEndTime: new Date()
                });
                return;
            }
            // Only stop if game is not active AND we haven't drawn all 75 numbers
            if (game.status !== 'active' && calledNumbers.length < 75) {
                this.stopAutoDraw(cashierId);
                return;
            }
            // Draw ONE number from pool (simple, no batch)
            const number = numberPoolService_1.numberPoolService.drawNumber(cashierId);
            if (number === null) {
                // Check if this is because all 75 numbers have been drawn
                const currentGame = await this.gameService.getGameData(sessionId);
                const currentCalledNumbers = currentGame?.gameData?.calledNumbers || [];
                if (currentCalledNumbers.length >= 75) {
                    // Stop auto draw (don't change game status - let other systems handle it)
                    this.stopAutoDraw(cashierId);
                    // Emit game completion event
                    this.emit('game_completed', {
                        cashierId,
                        sessionId,
                        finalProgress: 75,
                        gameEndTime: new Date()
                    });
                    return;
                }
                else {
                    throw new Error('No numbers available in pool');
                }
            }
            // Record the single number draw
            await this.gameService.recordNumberDraw(sessionId, number, 'auto');
            // Update stats with precise timing
            controller.stats.totalDraws++;
            controller.stats.successfulDraws++;
            controller.stats.lastDrawTime = new Date();
            // Calculate next draw time precisely - ensure consistent intervals
            const now = Date.now();
            controller.stats.nextDrawTime = new Date(now + controller.config.interval);
            // Simple performance score (no complex calculation)
            controller.stats.performanceScore = 100;
            this.emit('auto_draw_completed', {
                cashierId,
                sessionId,
                numbers: [number],
                stats: controller.stats
            });
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            // Simple error handling (no complex tracking)
            controller.stats.failedDraws++;
            controller.stats.totalDraws++;
            this.emit('auto_draw_error', { cashierId, sessionId, error: errorMsg, stats: controller.stats });
        }
        finally {
            // Always reset processing flag
            controller.isProcessing = false;
        }
    }
    // Removed complex adaptive timing and performance scoring
    // Now using simple, fixed 5000ms interval for stability
    /**
   * Update configuration for a specific cashier
   */
    updateCashierConfig(cashierId, newConfig, sessionId) {
        const controller = this.cashierControllers.get(cashierId);
        if (!controller)
            return false;
        const oldConfig = { ...controller.config };
        controller.config = { ...controller.config, ...newConfig };
        // Restart interval if timing changed (for stability)
        if (oldConfig.interval !== controller.config.interval && controller.isActive) {
            if (controller.interval) {
                clearInterval(controller.interval);
                controller.interval = setInterval(async () => {
                    await this.performAutoDraw(cashierId, sessionId);
                }, controller.config.interval);
            }
        }
        this.emit('config_updated', { cashierId, oldConfig, newConfig: controller.config });
        return true;
    }
    /**
     * Get auto draw statistics for a specific cashier
     */
    getCashierStats(cashierId) {
        const controller = this.cashierControllers.get(cashierId);
        return controller ? { ...controller.stats } : null;
    }
    /**
     * Get all active cashier controllers
     */
    getActiveControllers() {
        return Array.from(this.cashierControllers.keys()).filter(cashierId => this.cashierControllers.get(cashierId)?.isActive);
    }
    /**
     * Clean up controller for a specific cashier
     */
    cleanupCashierController(cashierId) {
        this.stopAutoDraw(cashierId);
        this.cashierControllers.delete(cashierId);
        numberPoolService_1.numberPoolService.cleanupCashierPool(cashierId);
        this.emit('controller_cleaned', { cashierId });
    }
    /**
     * Get global auto draw statistics
     */
    getGlobalStats() {
        let activeControllers = 0;
        let totalDraws = 0;
        let totalErrors = 0;
        let totalScore = 0;
        let scoreCount = 0;
        for (const controller of this.cashierControllers.values()) {
            if (controller.isActive)
                activeControllers++;
            totalDraws += controller.stats.totalDraws;
            totalErrors += controller.stats.failedDraws;
            totalScore += controller.stats.performanceScore;
            scoreCount++;
        }
        return {
            activeControllers,
            totalDraws,
            totalErrors,
            averagePerformanceScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
        };
    }
}
exports.AutoDrawController = AutoDrawController;
//# sourceMappingURL=autoDrawController.js.map