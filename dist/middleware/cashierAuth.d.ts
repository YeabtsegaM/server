import { Request, Response, NextFunction } from 'express';
interface CashierRequest extends Request {
    cashier?: {
        id: string;
        username: string;
        role: string;
        shopId: string;
    };
}
export declare const authenticateCashier: (req: CashierRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=cashierAuth.d.ts.map