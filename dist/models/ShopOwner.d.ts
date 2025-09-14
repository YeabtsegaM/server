import mongoose, { Document } from 'mongoose';
export interface IShopOwner extends Document {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'shop_owner';
    isActive: boolean;
    shops: mongoose.Types.ObjectId[];
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IShopOwner, {}, {}, {}, mongoose.Document<unknown, {}, IShopOwner, {}> & IShopOwner & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ShopOwner.d.ts.map