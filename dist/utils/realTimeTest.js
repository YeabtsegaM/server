"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeTestUtility = void 0;
/**
 * Test utility to demonstrate real-time functionality
 * This simulates database changes and shows how the RealTimeUpdateService responds
 */
class RealTimeTestUtility {
    constructor(realTimeService) {
        this.realTimeService = realTimeService;
    }
    /**
     * Test real-time update by forcing an immediate update for a session
     */
    async testRealTimeUpdate(sessionId) {
        console.log(`🧪 Testing real-time update for session: ${sessionId}`);
        try {
            // Force an immediate update
            await this.realTimeService.updateGameDataImmediate(sessionId);
            console.log(`✅ Real-time update test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Real-time update test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Test smart update (chooses between immediate and optimized)
     */
    async testSmartUpdate(sessionId) {
        console.log(`🧪 Testing smart update for session: ${sessionId}`);
        try {
            // Use smart update which chooses the best method
            await this.realTimeService.smartUpdate(sessionId);
            console.log(`✅ Smart update test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Smart update test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Simulate multiple rapid updates to test performance
     */
    async testRapidUpdates(sessionId, count = 5) {
        console.log(`🧪 Testing rapid updates (${count}) for session: ${sessionId}`);
        try {
            // Send multiple rapid updates
            for (let i = 0; i < count; i++) {
                console.log(`📡 Sending rapid update ${i + 1}/${count}`);
                await this.realTimeService.updateGameDataImmediate(sessionId);
                // Small delay between updates
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            console.log(`✅ Rapid updates test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Rapid updates test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Test page refresh functionality
     */
    testPageRefresh(sessionId, reason = 'Test refresh') {
        console.log(`🧪 Testing page refresh for session: ${sessionId}`);
        try {
            this.realTimeService.forcePageRefresh(sessionId, reason);
            console.log(`✅ Page refresh test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Page refresh test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Test batch updates for multiple sessions
     */
    async testBatchUpdates(sessionIds) {
        console.log(`🧪 Testing batch updates for ${sessionIds.length} sessions`);
        try {
            await this.realTimeService.batchUpdateSessions(sessionIds);
            console.log(`✅ Batch updates test completed for ${sessionIds.length} sessions`);
        }
        catch (error) {
            console.error(`❌ Batch updates test failed:`, error);
        }
    }
    /**
     * Test connection status updates
     */
    testConnectionStatusUpdate(sessionId, connectionData) {
        console.log(`🧪 Testing connection status update for session: ${sessionId}`);
        try {
            this.realTimeService.emitConnectionStatusUpdate(sessionId, connectionData);
            console.log(`✅ Connection status update test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Connection status update test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Test game status change updates
     */
    testGameStatusChange(sessionId, newStatus, gameData) {
        console.log(`🧪 Testing game status change to ${newStatus} for session: ${sessionId}`);
        try {
            this.realTimeService.emitGameStatusChange(sessionId, newStatus, gameData);
            console.log(`✅ Game status change test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Game status change test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Test financial data updates
     */
    testFinancialUpdate(sessionId, financialData) {
        console.log(`🧪 Testing financial update for session: ${sessionId}`);
        try {
            this.realTimeService.emitFinancialUpdate(sessionId, financialData);
            console.log(`✅ Financial update test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Financial update test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Test placed bets updates
     */
    testPlacedBetsUpdate(sessionId, placedBets, gameId) {
        console.log(`🧪 Testing placed bets update for session: ${sessionId}`);
        try {
            this.realTimeService.emitPlacedBetsUpdate(sessionId, placedBets, gameId);
            console.log(`✅ Placed bets update test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Placed bets update test failed for session: ${sessionId}:`, error);
        }
    }
    /**
     * Test game end with refresh
     */
    testGameEnd(sessionId, gameData) {
        console.log(`🧪 Testing game end with refresh for session: ${sessionId}`);
        try {
            this.realTimeService.emitGameEnd(sessionId, gameData);
            console.log(`✅ Game end test completed for session: ${sessionId}`);
        }
        catch (error) {
            console.error(`❌ Game end test failed for session: ${sessionId}:`, error);
        }
    }
}
exports.RealTimeTestUtility = RealTimeTestUtility;
exports.default = RealTimeTestUtility;
//# sourceMappingURL=realTimeTest.js.map