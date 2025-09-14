import { RealTimeUpdateService } from '../services/realTimeUpdateService';

/**
 * Test utility to demonstrate real-time functionality
 * This simulates database changes and shows how the RealTimeUpdateService responds
 */
export class RealTimeTestUtility {
  private realTimeService: RealTimeUpdateService;

  constructor(realTimeService: RealTimeUpdateService) {
    this.realTimeService = realTimeService;
  }

  /**
   * Test real-time update by forcing an immediate update for a session
   */
  async testRealTimeUpdate(sessionId: string) {
    console.log(`🧪 Testing real-time update for session: ${sessionId}`);
    
    try {
      // Force an immediate update
      await this.realTimeService.updateGameDataImmediate(sessionId);
      console.log(`✅ Real-time update test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Real-time update test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Test smart update (chooses between immediate and optimized)
   */
  async testSmartUpdate(sessionId: string) {
    console.log(`🧪 Testing smart update for session: ${sessionId}`);
    
    try {
      // Use smart update which chooses the best method
      await this.realTimeService.smartUpdate(sessionId);
      console.log(`✅ Smart update test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Smart update test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Simulate multiple rapid updates to test performance
   */
  async testRapidUpdates(sessionId: string, count: number = 5) {
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
    } catch (error) {
      console.error(`❌ Rapid updates test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Test page refresh functionality
   */
  testPageRefresh(sessionId: string, reason: string = 'Test refresh') {
    console.log(`🧪 Testing page refresh for session: ${sessionId}`);
    
    try {
      this.realTimeService.forcePageRefresh(sessionId, reason);
      console.log(`✅ Page refresh test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Page refresh test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Test batch updates for multiple sessions
   */
  async testBatchUpdates(sessionIds: string[]) {
    console.log(`🧪 Testing batch updates for ${sessionIds.length} sessions`);
    
    try {
      await this.realTimeService.batchUpdateSessions(sessionIds);
      console.log(`✅ Batch updates test completed for ${sessionIds.length} sessions`);
    } catch (error) {
      console.error(`❌ Batch updates test failed:`, error);
    }
  }

  /**
   * Test connection status updates
   */
  testConnectionStatusUpdate(sessionId: string, connectionData: any) {
    console.log(`🧪 Testing connection status update for session: ${sessionId}`);
    
    try {
      this.realTimeService.emitConnectionStatusUpdate(sessionId, connectionData);
      console.log(`✅ Connection status update test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Connection status update test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Test game status change updates
   */
  testGameStatusChange(sessionId: string, newStatus: string, gameData?: any) {
    console.log(`🧪 Testing game status change to ${newStatus} for session: ${sessionId}`);
    
    try {
      this.realTimeService.emitGameStatusChange(sessionId, newStatus, gameData);
      console.log(`✅ Game status change test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Game status change test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Test financial data updates
   */
  testFinancialUpdate(sessionId: string, financialData: any) {
    console.log(`🧪 Testing financial update for session: ${sessionId}`);
    
    try {
      this.realTimeService.emitFinancialUpdate(sessionId, financialData);
      console.log(`✅ Financial update test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Financial update test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Test placed bets updates
   */
  testPlacedBetsUpdate(sessionId: string, placedBets: number[], gameId?: string) {
    console.log(`🧪 Testing placed bets update for session: ${sessionId}`);
    
    try {
      this.realTimeService.emitPlacedBetsUpdate(sessionId, placedBets, gameId);
      console.log(`✅ Placed bets update test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Placed bets update test failed for session: ${sessionId}:`, error);
    }
  }

  /**
   * Test game end with refresh
   */
  testGameEnd(sessionId: string, gameData: any) {
    console.log(`🧪 Testing game end with refresh for session: ${sessionId}`);
    
    try {
      this.realTimeService.emitGameEnd(sessionId, gameData);
      console.log(`✅ Game end test completed for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Game end test failed for session: ${sessionId}:`, error);
    }
  }
}

export default RealTimeTestUtility;
