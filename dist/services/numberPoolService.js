"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberPoolService = exports.NumberPoolService = void 0;
const events_1 = require("events");
class NumberPoolService extends events_1.EventEmitter {
    constructor() {
        super();
        this.cashierPools = new Map();
        this.defaultConfig = {
            minNumber: 1,
            maxNumber: 75,
            autoShuffle: true,
            shuffleThreshold: 1.0 // 100% drawn before auto-shuffle (draw all 75 numbers)
        };
        // Ensure pool always has exactly 75 numbers
        this.POOL_SIZE = 75;
        console.log('🎯 NumberPoolService initialized with cashier isolation');
    }
    /**
     * Initialize or reset number pool for a specific cashier
     */
    initializeCashierPool(cashierId, config) {
        const fullConfig = { ...this.defaultConfig, ...config };
        const availableNumbers = new Set();
        // Always generate exactly 75 numbers (1-75)
        for (let i = 1; i <= this.POOL_SIZE; i++) {
            availableNumbers.add(i);
        }
        const pool = {
            availableNumbers,
            drawnNumbers: new Set(),
            config: fullConfig,
            stats: {
                totalNumbers: this.POOL_SIZE,
                drawnNumbers: 0,
                remainingNumbers: this.POOL_SIZE,
                drawCount: 0,
                averageDrawTime: 0
            },
            lastDrawTime: Date.now(),
            drawTimes: []
        };
        this.cashierPools.set(cashierId, pool);
        console.log(`🎯 Initialized number pool for cashier ${cashierId} with ${pool.stats.totalNumbers} numbers`);
        this.emit('pool_initialized', { cashierId, config: fullConfig });
    }
    /**
     * Draw a random number for a specific cashier
     */
    drawNumber(cashierId) {
        const pool = this.cashierPools.get(cashierId);
        if (!pool) {
            console.error(`❌ No number pool found for cashier ${cashierId}`);
            return null;
        }
        if (pool.availableNumbers.size === 0) {
            console.log(`🏁 All 75 numbers drawn for cashier ${cashierId}, no more numbers available - game should end`);
            return null; // Return null to indicate no more numbers available
        }
        // Convert Set to Array for random selection
        const availableArray = Array.from(pool.availableNumbers);
        const randomIndex = Math.floor(Math.random() * availableArray.length);
        const drawnNumber = availableArray[randomIndex];
        // Remove from available, add to drawn
        pool.availableNumbers.delete(drawnNumber);
        pool.drawnNumbers.add(drawnNumber);
        // Update stats
        const now = Date.now();
        const drawTime = now - pool.lastDrawTime;
        pool.drawTimes.push(drawTime);
        pool.lastDrawTime = now;
        pool.stats.drawnNumbers++;
        pool.stats.remainingNumbers--;
        pool.stats.drawCount++;
        // Calculate average draw time (keep last 10 draws for performance)
        if (pool.drawTimes.length > 10) {
            pool.drawTimes.shift();
        }
        pool.stats.averageDrawTime = pool.drawTimes.reduce((a, b) => a + b, 0) / pool.drawTimes.length;
        // Check if auto-shuffle is needed (100% - all 75 numbers drawn)
        if (pool.config.autoShuffle &&
            pool.stats.drawnNumbers / pool.stats.totalNumbers >= pool.config.shuffleThreshold) {
            console.log(`🏁 All 75 numbers drawn for cashier ${cashierId}, game should end - not auto-shuffling`);
            // Don't auto-shuffle - let the game end naturally
            // The AutoDrawController will handle game completion
        }
        console.log(`🎲 Cashier ${cashierId} drew number ${drawnNumber} (${pool.stats.remainingNumbers} remaining)`);
        this.emit('number_drawn', {
            cashierId,
            number: drawnNumber,
            stats: pool.stats,
            remainingCount: pool.stats.remainingNumbers
        });
        return drawnNumber;
    }
    /**
     * Shuffle the pool for a specific cashier (puts all numbers back)
     */
    shuffleCashierPool(cashierId) {
        const pool = this.cashierPools.get(cashierId);
        if (!pool) {
            console.error(`❌ No number pool found for cashier ${cashierId}`);
            return;
        }
        // Reset the pool
        this.initializeCashierPool(cashierId, pool.config);
        console.log(`🔄 Shuffled number pool for cashier ${cashierId}`);
        this.emit('pool_shuffled', { cashierId, config: pool.config });
    }
    /**
     * Get pool statistics for a specific cashier
     */
    getCashierPoolStats(cashierId) {
        const pool = this.cashierPools.get(cashierId);
        return pool ? { ...pool.stats } : null;
    }
    /**
     * Get remaining numbers for a specific cashier
     */
    getRemainingNumbers(cashierId) {
        const pool = this.cashierPools.get(cashierId);
        return pool ? Array.from(pool.availableNumbers).sort((a, b) => a - b) : [];
    }
    /**
     * Get drawn numbers for a specific cashier
     */
    getDrawnNumbers(cashierId) {
        const pool = this.cashierPools.get(cashierId);
        return pool ? Array.from(pool.drawnNumbers).sort((a, b) => a - b) : [];
    }
    /**
     * Check if a number is available for a specific cashier
     */
    isNumberAvailable(cashierId, number) {
        const pool = this.cashierPools.get(cashierId);
        return pool ? pool.availableNumbers.has(number) : false;
    }
    /**
     * Clean up pool for a specific cashier (when they disconnect)
     */
    cleanupCashierPool(cashierId) {
        this.cashierPools.delete(cashierId);
        console.log(`🧹 Cleaned up number pool for cashier ${cashierId}`);
        this.emit('pool_cleaned', { cashierId });
    }
    /**
     * Get all active cashier IDs
     */
    getActiveCashierIds() {
        return Array.from(this.cashierPools.keys());
    }
    /**
     * Get global statistics across all cashiers
     */
    getGlobalStats() {
        const activeCashiers = this.cashierPools.size;
        let totalNumbersDrawn = 0;
        let totalDrawTime = 0;
        let drawTimeCount = 0;
        for (const pool of this.cashierPools.values()) {
            totalNumbersDrawn += pool.stats.drawnNumbers;
            totalDrawTime += pool.stats.averageDrawTime * pool.stats.drawCount;
            drawTimeCount += pool.stats.drawCount;
        }
        return {
            activeCashiers,
            totalNumbersDrawn,
            averageDrawTime: drawTimeCount > 0 ? totalDrawTime / drawTimeCount : 0
        };
    }
    /**
     * Sync pool with actual game state (called numbers)
     */
    syncPoolWithGameState(cashierId, calledNumbers) {
        const pool = this.cashierPools.get(cashierId);
        if (!pool)
            return;
        // Reset pool to initial state
        const availableNumbers = new Set();
        for (let i = 1; i <= this.POOL_SIZE; i++) {
            availableNumbers.add(i);
        }
        // Remove called numbers from available pool
        for (const number of calledNumbers) {
            availableNumbers.delete(number);
        }
        // Update pool state
        pool.availableNumbers = availableNumbers;
        pool.drawnNumbers = new Set(calledNumbers);
        pool.stats.drawnNumbers = calledNumbers.length;
        pool.stats.remainingNumbers = this.POOL_SIZE - calledNumbers.length;
        console.log(`🔄 Synced number pool for cashier ${cashierId}: ${calledNumbers.length} numbers already drawn`);
    }
}
exports.NumberPoolService = NumberPoolService;
// Export singleton instance
exports.numberPoolService = new NumberPoolService();
//# sourceMappingURL=numberPoolService.js.map