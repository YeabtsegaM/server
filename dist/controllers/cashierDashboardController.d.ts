import { Request, Response } from 'express';
interface CashierRequest extends Request {
    cashier?: {
        id: string;
        username: string;
        role: string;
        shopId: string;
    };
}
export declare const getDashboardStats: (req: CashierRequest, res: Response) => Promise<void>;
export declare const getRecentActivity: (req: CashierRequest, res: Response) => Promise<void>;
export declare const getCashierSummary: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=cashierDashboardController.d.ts.map