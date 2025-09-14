import { RealTimeUpdateService } from '../services/realTimeUpdateService';
/**
 * Test utility to demonstrate real-time functionality
 * This simulates database changes and shows how the RealTimeUpdateService responds
 */
export declare class RealTimeTestUtility {
    private realTimeService;
    constructor(realTimeService: RealTimeUpdateService);
    /**
     * Test real-time update by forcing an immediate update for a session
     */
    testRealTimeUpdate(sessionId: string): Promise<void>;
    /**
     * Test smart update (chooses between immediate and optimized)
     */
    testSmartUpdate(sessionId: string): Promise<void>;
    /**
     * Simulate multiple rapid updates to test performance
     */
    testRapidUpdates(sessionId: string, count?: number): Promise<void>;
    /**
     * Test page refresh functionality
     */
    testPageRefresh(sessionId: string, reason?: string): void;
    /**
     * Test batch updates for multiple sessions
     */
    testBatchUpdates(sessionIds: string[]): Promise<void>;
    /**
     * Test connection status updates
     */
    testConnectionStatusUpdate(sessionId: string, connectionData: any): void;
    /**
     * Test game status change updates
     */
    testGameStatusChange(sessionId: string, newStatus: string, gameData?: any): void;
    /**
     * Test financial data updates
     */
    testFinancialUpdate(sessionId: string, financialData: any): void;
    /**
     * Test placed bets updates
     */
    testPlacedBetsUpdate(sessionId: string, placedBets: number[], gameId?: string): void;
    /**
     * Test game end with refresh
     */
    testGameEnd(sessionId: string, gameData: any): void;
}
export default RealTimeTestUtility;
//# sourceMappingURL=realTimeTest.d.ts.map