import { Server } from 'socket.io';

export class RefreshService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Emit refresh event to display when important game events happen
   */
  public emitRefreshEvent(sessionId: string, reason: string) {
    try {
      this.io.to(`display:${sessionId}`).emit('refresh_pages', {
        reason,
        timestamp: new Date(),
        message: `Page refresh triggered: ${reason}`
      });
      
    } catch (error) {
      console.error(`Error emitting refresh event for session ${sessionId}:`, error);
    }
  }

  /**
   * Emit refresh when game starts
   */
  public emitGameStartRefresh(sessionId: string) {
    this.emitRefreshEvent(sessionId, 'Game started');
  }

  /**
   * Emit refresh when game ends
   */
  public emitGameEndRefresh(sessionId: string) {
    this.emitRefreshEvent(sessionId, 'Game ended');
  }

  /**
   * Emit refresh when bets are placed
   */
  public emitBetPlacedRefresh(sessionId: string) {
    this.emitRefreshEvent(sessionId, 'Bets placed');
  }

  /**
   * Emit refresh when game resets
   */
  public emitGameResetRefresh(sessionId: string) {
    this.emitRefreshEvent(sessionId, 'Game reset');
  }
}

export default RefreshService;
