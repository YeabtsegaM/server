import { Server } from 'socket.io';
import { AutoDrawController } from './autoDrawController';
interface GameSession {
    gameId: string;
    cashierId: string | null;
    sessionId: string;
    displayToken: string;
    roomName: string;
    isConnected: boolean;
    connectedAt: Date;
    status?: string;
    gameData?: {
        calledNumbers?: number[];
        progress?: number;
        cartelas?: number;
        totalStack?: number;
        totalWinStack?: number;
        totalShopMargin?: number;
        totalSystemFee?: number;
        netPrizePool?: number;
        selectedCartelas?: number[];
        placedBetCartelas?: number[];
        winPatterns?: any[];
        verifiedCartelas?: number[];
        verificationResults?: Record<string, any>;
        drawHistory?: any[];
        gameStartTime?: Date;
        currentNumber?: number | null;
        gameEndTime?: Date | null;
        lastDrawTime?: Date | null;
    };
}
declare class GameService {
    private io;
    private activeGames;
    private autoDrawController;
    constructor(io: Server);
    createGameSession(cashierId: string, sessionId: string, displayToken: string): Promise<GameSession>;
    joinGameRoom(socket: any, sessionId: string, displayToken: string, cashierId?: string): Promise<GameSession | null>;
    createWaitingGameSession(sessionId: string, displayToken: string): Promise<GameSession>;
    broadcastGameDataUpdate(sessionId: string): Promise<void>;
    updateGameStatus(sessionId: string, status: string, gameData?: any): Promise<void>;
    startGame(sessionId: string, selectedCartelas: number[]): Promise<void>;
    recordNumberDraw(sessionId: string, number: number, drawnBy?: 'manual' | 'auto'): Promise<void>;
    /**
     * Get the auto draw controller instance
     */
    getAutoDrawController(): AutoDrawController;
    /**
     * Initialize auto draw for a cashier
     */
    initializeAutoDraw(cashierId: string, sessionId: string, config?: any): Promise<void>;
    /**
     * Sync number pool with current game state
     */
    private syncNumberPoolWithGame;
    /**
     * Save auto draw configuration to database
     */
    private saveAutoDrawConfig;
    /**
     * Load auto draw configuration from database
     */
    loadAutoDrawConfig(cashierId: string, sessionId: string): Promise<any>;
    /**
     * Start auto draw for a cashier
     */
    startAutoDraw(cashierId: string, sessionId: string): Promise<boolean>;
    /**
     * Stop auto draw for a cashier
     */
    stopAutoDraw(cashierId: string): boolean;
    /**
     * Update auto draw configuration for a cashier
     */
    updateAutoDrawConfig(cashierId: string, config: any, sessionId?: string): Promise<boolean>;
    /**
     * Get auto draw statistics for a cashier
     */
    getAutoDrawStats(cashierId: string): any;
    /**
     * Get number pool statistics for a cashier
     */
    getNumberPoolStats(cashierId: string): any;
    /**
     * Shuffle number pool for a cashier
     */
    shuffleNumberPool(cashierId: string): void;
    /**
     * Clean up auto draw for a cashier
     */
    cleanupAutoDraw(cashierId: string): void;
    updateConnectionStatus(sessionId: string, type: 'cashier' | 'display', connected: boolean): Promise<void>;
    emitConnectionStatusUpdate(sessionId: string): Promise<void>;
    disconnectGameSession(sessionId: string): Promise<void>;
    resetGame(sessionId: string): Promise<void>;
    getActiveGames(): Promise<any[]>;
    getGameSession(sessionId: string): GameSession | undefined;
    getAllActiveSessions(): GameSession[];
    getGameData(sessionId: string): Promise<any>;
}
export default GameService;
//# sourceMappingURL=gameService.d.ts.map