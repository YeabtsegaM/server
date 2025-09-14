import { Socket } from 'socket.io';
import GameService from '../services/gameService';
export declare class CashierSocketHandler {
    private gameService;
    private io;
    private selectedCartelas;
    private lastEmittedSelections;
    private gameCache;
    private readonly CACHE_TTL;
    private pendingDbUpdates;
    private readonly BATCH_DELAY;
    private lastSocketCheckTime;
    constructor(gameService: GameService, io: any);
    private getGameData;
    private scheduleDbUpdate;
    handleConnection(socket: Socket, cashierId: string, sessionId: string): Promise<void>;
    /**
     * Calculate total win stack based on game progress and winning patterns
     */
    private calculateTotalWinStack;
    private setupEventHandlers;
    private setupConnectionStatusCheck;
    cleanupSession(sessionId: string): void;
    private getConsistentGameId;
    private setupRealTimeSync;
    private joinGameRoom;
    private handleDisconnect;
    clearSelectedCartelas(sessionId: string): Promise<void>;
    private haveSelectionsChanged;
    private updateLastEmittedSelections;
}
//# sourceMappingURL=cashierSocket.d.ts.map