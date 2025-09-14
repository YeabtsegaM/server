import { Server } from 'socket.io';
export declare class RefreshService {
    private io;
    constructor(io: Server);
    /**
     * Emit refresh event to display when important game events happen
     */
    emitRefreshEvent(sessionId: string, reason: string): void;
    /**
     * Emit refresh when game starts
     */
    emitGameStartRefresh(sessionId: string): void;
    /**
     * Emit refresh when game ends
     */
    emitGameEndRefresh(sessionId: string): void;
    /**
     * Emit refresh when bets are placed
     */
    emitBetPlacedRefresh(sessionId: string): void;
    /**
     * Emit refresh when game resets
     */
    emitGameResetRefresh(sessionId: string): void;
}
export default RefreshService;
//# sourceMappingURL=refreshService.d.ts.map