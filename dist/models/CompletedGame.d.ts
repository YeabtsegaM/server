import mongoose, { Document } from 'mongoose';
export interface ICompletedGame extends Document {
    gameId: string | number;
    cashierId: mongoose.Types.ObjectId;
    sessionId: string;
    status: string;
    gameData: {
        gameStartTime?: Date;
        gameEndTime?: Date;
        finalProgress: number;
        finalCalledNumbers: number[];
        finalCurrentNumber: number | null;
        finalCartelas: number;
        finalTotalStack: number;
        finalTotalWinStack: number;
        finalTotalShopMargin: number;
        finalTotalSystemFee: number;
        finalNetPrizePool: number;
        finalDrawHistory: Array<{
            number: number;
            timestamp: Date;
            type: string;
        }>;
        finalSelectedCartelas: number[];
        finalPlacedBetCartelas: number[];
        finalWinPatterns: any[];
        finalVerificationResults?: Record<string, {
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
        completedAt: Date;
    };
    connectionStatus?: {
        cashierConnected: boolean;
        displayConnected: boolean;
        lastCashierActivity?: Date;
        lastDisplayActivity?: Date;
    };
    createdAt: Date;
    completedAt: Date;
}
declare const _default: mongoose.Model<ICompletedGame, {}, {}, {}, mongoose.Document<unknown, {}, ICompletedGame, {}> & ICompletedGame & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=CompletedGame.d.ts.map