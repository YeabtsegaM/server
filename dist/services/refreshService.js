"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshService = void 0;
class RefreshService {
    constructor(io) {
        this.io = io;
    }
    /**
     * Emit refresh event to display when important game events happen
     */
    emitRefreshEvent(sessionId, reason) {
        try {
            this.io.to(`display:${sessionId}`).emit('refresh_pages', {
                reason,
                timestamp: new Date(),
                message: `Page refresh triggered: ${reason}`
            });
        }
        catch (error) {
            console.error(`Error emitting refresh event for session ${sessionId}:`, error);
        }
    }
    /**
     * Emit refresh when game starts
     */
    emitGameStartRefresh(sessionId) {
        this.emitRefreshEvent(sessionId, 'Game started');
    }
    /**
     * Emit refresh when game ends
     */
    emitGameEndRefresh(sessionId) {
        this.emitRefreshEvent(sessionId, 'Game ended');
    }
    /**
     * Emit refresh when bets are placed
     */
    emitBetPlacedRefresh(sessionId) {
        this.emitRefreshEvent(sessionId, 'Bets placed');
    }
    /**
     * Emit refresh when game resets
     */
    emitGameResetRefresh(sessionId) {
        this.emitRefreshEvent(sessionId, 'Game reset');
    }
}
exports.RefreshService = RefreshService;
exports.default = RefreshService;
//# sourceMappingURL=refreshService.js.map