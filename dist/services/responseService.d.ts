import { Response } from 'express';
export declare class ResponseService {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number): void;
    static created<T>(res: Response, data: T, message?: string): void;
    static updated<T>(res: Response, data: T, message?: string): void;
    static deleted(res: Response, message?: string): void;
    static error(res: Response, message: string, statusCode?: number): void;
    static badRequest(res: Response, message: string): void;
    static unauthorized(res: Response, message?: string): void;
    static forbidden(res: Response, message?: string): void;
    static locked(res: Response, message?: string): void;
    static notFound(res: Response, resource: string): void;
    static validationError(res: Response, message: string): void;
    static serverError(res: Response, message?: string): void;
}
//# sourceMappingURL=responseService.d.ts.map