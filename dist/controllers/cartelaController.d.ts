import { Request, Response } from 'express';
export declare const getCartelas: (req: Request, res: Response) => Promise<void>;
export declare const getCartelasForDisplay: (req: Request, res: Response) => Promise<void>;
export declare const getCartela: (req: Request, res: Response) => Promise<void>;
export declare const createCartela: (req: Request, res: Response) => Promise<void>;
export declare const updateCartela: (req: Request, res: Response) => Promise<void>;
export declare const deleteCartela: (req: Request, res: Response) => Promise<void>;
export declare const toggleCartelaStatus: (req: Request, res: Response) => Promise<void>;
export declare const getActiveCartelas: (req: Request, res: Response) => Promise<void>;
export declare const getCartelaByCartelaId: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=cartelaController.d.ts.map