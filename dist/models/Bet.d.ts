import mongoose, { Document } from 'mongoose';
export interface IBet extends Document {
    ticketNumber: string;
    betId: string;
    gameId: string | number;
    cashierId: mongoose.Types.ObjectId;
    sessionId: string;
    cartelaId: number;
    stake: number;
    betType: 'single' | 'multiple' | 'combination';
    betStatus: 'pending' | 'active' | 'won' | 'lost' | 'cancelled' | 'won_redeemed' | 'lost_redeemed';
    gameProgress: number;
    selectedNumbers: number[];
    winPattern?: string;
    win: number;
    notes?: string;
    isVerified: boolean;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    placedAt: Date;
    settledAt?: Date;
    verificationLocked?: boolean;
    verificationLockedAt?: Date;
    verificationLockedBy?: mongoose.Types.ObjectId;
}
declare const Bet: mongoose.Model<IBet, {}, {}, {}, mongoose.Document<unknown, {}, IBet, {}> & IBet & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export { Bet };
export default Bet;
//# sourceMappingURL=Bet.d.ts.map