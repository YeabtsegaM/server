import { Response } from 'express';
interface BaseDocument {
    _id: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class DatabaseService {
    static findById<T extends BaseDocument>(model: any, id: string, res: Response, resourceName: string, select?: string, useCache?: boolean): Promise<T | null>;
    static findAll<T extends BaseDocument>(model: any, res: Response, resourceName: string, options?: {
        select?: string;
        sort?: any;
        populate?: any;
        filter?: any;
        limit?: number;
        useCache?: boolean;
    }): Promise<T[] | null>;
    static clearCache(resourceName?: string): void;
    static clearItemCache(resourceName: string, itemId: string): void;
    static create<T extends BaseDocument>(model: any, data: any, res: Response, resourceName: string, transformData?: (data: T) => any): Promise<T | null>;
    static updateById<T extends BaseDocument>(model: any, id: string, updateData: any, res: Response, resourceName: string, options?: {
        new?: boolean;
        runValidators?: boolean;
        select?: string;
        populate?: any;
    }): Promise<T | null>;
    static deleteById(model: any, id: string, res: Response, resourceName: string): Promise<boolean>;
    static exists(model: any, filter: any, res: Response, resourceName: string, errorMessage: string): Promise<boolean>;
    static hashPassword(password: string, saltRounds?: number): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=databaseService.d.ts.map