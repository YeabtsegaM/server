import { Request, Response } from 'express';
export declare const getCashiers: (req: Request, res: Response) => Promise<void>;
export declare const createCashier: (req: Request, res: Response) => Promise<void>;
export declare const updateCashier: (req: Request, res: Response) => Promise<void>;
export declare const deleteCashier: (req: Request, res: Response) => Promise<void>;
export declare const toggleCashierStatus: (req: Request, res: Response) => Promise<void>;
export declare const updateCashierSession: (req: Request, res: Response) => Promise<void>;
export declare const updateConnectionStatus: (req: Request, res: Response) => Promise<void>;
export declare const regenerateSessionId: (req: Request, res: Response) => Promise<void>;
export declare const getCashierSession: (req: Request, res: Response) => Promise<void>;
export declare const getCashierBatFileContent: (req: Request, res: Response) => Promise<void>;
export declare const getCashierSessionForAdmin: (req: Request, res: Response) => Promise<void>;
interface CashierRequest extends Request {
    cashier?: {
        id: string;
        username: string;
        role: string;
        shopId: string;
    };
}
export declare const getCashierProfile: (req: CashierRequest, res: Response) => Promise<void>;
export declare const updateCashierProfile: (req: CashierRequest, res: Response) => Promise<void>;
export declare const getCashierSettings: (req: CashierRequest, res: Response) => Promise<void>;
export declare const updateCashierSettings: (req: CashierRequest, res: Response) => Promise<void>;
export declare const getCurrentGame: (req: CashierRequest, res: Response) => Promise<void>;
export declare const startGame: (req: CashierRequest, res: Response) => Promise<void>;
export declare const pauseGame: (req: CashierRequest, res: Response) => Promise<void>;
export declare const resumeGame: (req: CashierRequest, res: Response) => Promise<void>;
export declare const endGame: (req: CashierRequest, res: Response) => Promise<void>;
export declare const resetGame: (req: CashierRequest, res: Response) => Promise<void>;
export declare const refreshCashierSession: (req: Request, res: Response) => Promise<void>;
export declare const getNextGameInfo: (req: CashierRequest, res: Response) => Promise<void>;
export declare const getPlacedBetCartelas: (req: CashierRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=cashierController.d.ts.map