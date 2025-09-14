import { Server } from 'socket.io';
/**
 * Enhanced Real-Time Update Service
 *
 * Features:
 * - Immediate real-time updates (no delays)
 * - Page refresh capabilities
 * - Optimized data transmission
 * - Batch updates for better performance
 */
export declare class RealTimeUpdateService {
    private io;
    constructor(io: Server);
    /**
     * IMMEDIATE real-time update - fastest possible update
     * Updates game data and emits to all connected clients instantly
     */
    updateGameDataImmediate(sessionId: string, gameId?: string): Promise<void>;
    /**
     * Emit game data update IMMEDIATELY to all clients
     * No delays, instant transmission
     */
    private emitGameDataUpdateImmediate;
    /**
     * Force page refresh for all connected clients
     * Useful when major changes occur
     */
    forcePageRefresh(sessionId: string, reason?: string): void;
    /**
     * Smart update - chooses between immediate and delayed based on data size
     */
    smartUpdate(sessionId: string, gameId?: string): Promise<void>;
    /**
     * Optimized update for large data sets
     * Compresses data and batches updates
     */
    private updateGameDataOptimized;
    /**
     * Create compressed payload for large data sets
     */
    private createCompressedPayload;
    /**
     * Batch update multiple sessions at once
     * For better performance when updating multiple games
     */
    batchUpdateSessions(sessionIds: string[]): Promise<void>;
    /**
     * Emit connection status update with real-time data
     */
    emitConnectionStatusUpdate(sessionId: string, connectionData: any): void;
    /**
     * Emit game status change with immediate update
     */
    emitGameStatusChange(sessionId: string, newStatus: string, gameData?: any): void;
    /**
     * Emit financial update with real-time totals
     */
    emitFinancialUpdate(sessionId: string, financialData: any): void;
    /**
     * Emit placed bets update with real-time data
     */
    emitPlacedBetsUpdate(sessionId: string, placedBets: number[], gameId?: string): void;
    /**
     * Emit game end with immediate data refresh
     */
    emitGameEnd(sessionId: string, gameData: any): void;
}
export default RealTimeUpdateService;
//# sourceMappingURL=realTimeUpdateService.d.ts.map