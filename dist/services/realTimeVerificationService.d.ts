import { Server } from 'socket.io';
import { PatternMatchResult } from './winPatternService';
export declare class RealTimeVerificationService {
    private io;
    constructor(io: Server);
    /**
     * Check for winners after each number is drawn
     * High-performance real-time checking (optional - for display purposes)
     */
    checkForWinnersAfterDraw(gameId: string, sessionId: string, cashierId: string, drawnNumbers: number[]): Promise<void>;
    /**
     * Get real-time verification status for a cartela
     * Used when cashier manually verifies (1-to-1 verification)
     */
    getCartelaVerificationStatus(gameId: string, cartelaId: number, cashierId: string, drawnNumbers: number[]): Promise<PatternMatchResult | null>;
    /**
     * Emit verification result to all connected clients
     */
    emitVerificationResult(sessionId: string, cashierId: string, verificationData: {
        cartelaId: number;
        gameId: string;
        status: string;
        patterns: string[];
        patternNames: string[];
        matchedNumbers: number[];
        verifiedAt: Date;
        verifiedBy: string;
        drawnNumbers: number[];
    }): void;
    /**
     * Get verification statistics for a game
     */
    getGameVerificationStats(gameId: string, sessionId: string): Promise<any>;
}
export default RealTimeVerificationService;
//# sourceMappingURL=realTimeVerificationService.d.ts.map