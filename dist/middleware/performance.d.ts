import { Request, Response, NextFunction } from 'express';
export declare const performanceMonitor: (req: Request, res: Response, next: NextFunction) => void;
export declare const memoryMonitor: () => void;
export declare const queryMonitor: (operation: string, duration: number) => void;
//# sourceMappingURL=performance.d.ts.map