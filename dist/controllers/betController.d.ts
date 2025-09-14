import { Request, Response } from 'express';
interface BetRequest extends Request {
    cashier?: {
        id: string;
        username: string;
        role: string;
        shopId: string;
    };
}
export declare const placeBet: (req: BetRequest, res: Response) => Promise<void>;
export declare const getRecentBets: (req: BetRequest, res: Response) => Promise<void>;
export declare const getRecallBets: (req: BetRequest, res: Response) => Promise<void>;
export declare const getBetByTicketNumber: (req: BetRequest, res: Response) => Promise<void>;
export declare const printRecallTicket: (req: BetRequest, res: Response) => Promise<void>;
export declare const getPlacedBetCartelas: (req: BetRequest, res: Response) => Promise<void>;
export declare const getPlacedBetCartelasForDisplay: (req: Request, res: Response) => Promise<void>;
export declare const searchTicketByNumber: (req: BetRequest, res: Response) => Promise<void>;
export declare const cancelTicket: (req: BetRequest, res: Response) => Promise<void>;
export declare const redeemTicket: (req: BetRequest, res: Response) => Promise<void>;
declare const _default: {
    placeBet: (req: BetRequest, res: Response) => Promise<void>;
    getRecentBets: (req: BetRequest, res: Response) => Promise<void>;
    getRecallBets: (req: BetRequest, res: Response) => Promise<void>;
    getBetByTicketNumber: (req: BetRequest, res: Response) => Promise<void>;
    printRecallTicket: (req: BetRequest, res: Response) => Promise<void>;
    getPlacedBetCartelas: (req: BetRequest, res: Response) => Promise<void>;
    searchTicketByNumber: (req: BetRequest, res: Response) => Promise<void>;
    cancelTicket: (req: BetRequest, res: Response) => Promise<void>;
    redeemTicket: (req: BetRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=betController.d.ts.map