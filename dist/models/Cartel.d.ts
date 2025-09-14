import mongoose, { Document } from 'mongoose';
export interface ICartela extends Document {
    cartelaId: number;
    pattern: number[][];
    isActive: boolean;
    cashierId: string;
    shopId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Cartela: mongoose.Model<ICartela, {}, {}, {}, mongoose.Document<unknown, {}, ICartela, {}> & ICartela & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Cartel.d.ts.map