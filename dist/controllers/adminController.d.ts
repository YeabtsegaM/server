import { Request, Response } from 'express';
/**
 * Admin Controller - Handles admin operations including betting configuration
 */
export declare class AdminController {
    /**
     * Update shop-specific betting configuration (Shop Margin, System Fee)
     */
    static updateShopBettingConfig(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
   * Get shop-specific betting configuration
   */
    static getShopBettingConfig(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=adminController.d.ts.map