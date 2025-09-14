import mongoose, { Document } from 'mongoose';
export interface ICashier extends Document {
    shop: mongoose.Types.ObjectId;
    fullName: string;
    username: string;
    password: string;
    isActive: boolean;
    role: 'cashier';
    lastLogin?: Date;
    sessionId?: string;
    displayUrl?: string;
    isConnected?: boolean;
    lastActivity?: Date;
    currentGameId?: number;
    lastGameDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<ICashier, {}, {}, {}, mongoose.Document<unknown, {}, ICashier, {}> & ICashier & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Cashier.d.ts.map