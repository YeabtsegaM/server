import mongoose, { Document } from 'mongoose';
export interface IGlobalConfig extends Document {
    id: string;
    batTemplate: string;
    displayBaseUrl: string;
    shopMargin: number;
    systemFee: number;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IGlobalConfig, {}, {}, {}, mongoose.Document<unknown, {}, IGlobalConfig, {}> & IGlobalConfig & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=GlobalConfig.d.ts.map