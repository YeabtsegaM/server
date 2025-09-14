import { Request, Response } from 'express';
interface VerificationRequest extends Request {
    cashier?: {
        id: string;
        username: string;
        role: string;
        shopId: string;
    };
}
/**
 * Verify a specific cartela for win/lost status
 * High-performance 1-to-1 verification in real-time
 */
export declare const verifyCartela: (req: VerificationRequest, res: Response) => Promise<void>;
/**
 * Get verification status for all cartelas in a game
 * High-performance endpoint for bulk verification status
 */
export declare const getGameVerificationStatus: (req: VerificationRequest, res: Response) => Promise<void>;
/**
 * Batch verify multiple cartelas for performance
 * High-performance endpoint for multiple verifications
 */
export declare const batchVerifyCartelas: (req: VerificationRequest, res: Response) => Promise<void>;
/**
 * Manually lock verification for a cartela (cashier-controlled)
 */
export declare const lockVerification: (req: VerificationRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=verificationController.d.ts.map