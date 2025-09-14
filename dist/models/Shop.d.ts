import mongoose, { Document } from 'mongoose';
export interface IShop extends Document {
    shopName: string;
    location: string;
    owner: mongoose.Types.ObjectId;
    margin: number;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IShop, {}, {}, {}, mongoose.Document<unknown, {}, IShop, {}> & IShop & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Shop.d.ts.map