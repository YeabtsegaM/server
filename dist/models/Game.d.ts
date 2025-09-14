import mongoose, { Document } from 'mongoose';
export interface IGame extends Document {
    gameId: string;
    cashierId: string | null;
    sessionId: string;
    displayToken: string;
    status: 'waiting' | 'active' | 'paused' | 'completed';
    isConnected: boolean;
    connectedAt: Date;
    disconnectedAt?: Date;
    lastActivity: Date;
    gameData?: {
        calledNumbers: number[];
        currentNumber?: number;
        progress: number;
        cartelas: number;
        stack: number;
        totalStack: number;
        totalWinStack: number;
        totalShopMargin: number;
        totalSystemFee: number;
        netPrizePool: number;
        netShopProfit: number;
        selectedCartelas: number[];
        placedBetCartelas: number[];
        winningCartelas: number[];
        winPatterns?: string[];
        verifiedCartelas?: number[];
        verificationResults?: Record<string, {
            status: 'won' | 'lost';
            patterns: string[];
            patternNames: string[];
            allMatchedPatterns: Array<{
                patternId: string;
                patternName: string;
                matchedNumbers: number[];
            }>;
            matchedNumbers: number[];
            verifiedAt: Date;
            verifiedBy: string;
            drawnNumbers: number[];
        }>;
        hasWinners?: boolean;
        winnerCount?: number;
        lastWinnerCheck?: Date;
        gameStartTime?: Date;
        gameEndTime?: Date;
        lastDrawTime?: Date;
        autoDrawConfig?: {
            cashierId: string;
            config: any;
            lastUpdated: Date;
        };
        drawHistory: Array<{
            number: number;
            timestamp: Date;
            drawnBy: 'manual' | 'auto';
        }>;
    };
    connectionStatus: {
        cashierConnected: boolean;
        displayConnected: boolean;
        lastCashierActivity?: Date;
        lastDisplayActivity?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IGame, {}, {}, {}, mongoose.Document<unknown, {}, IGame, {}> & IGame & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Game.d.ts.map