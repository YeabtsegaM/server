import mongoose, { Document } from 'mongoose';
export interface IWinPattern extends Document {
    name: string;
    pattern: boolean[][];
    isActive: boolean;
    cashierId: string;
    shopId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WinPattern: mongoose.Model<IWinPattern, {}, {}, {}, mongoose.Document<unknown, {}, IWinPattern, {}> & IWinPattern & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=WinPattern.d.ts.map