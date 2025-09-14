import { Request, Response, NextFunction } from 'express';
interface ValidationRule {
    field: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: string[];
    custom?: (value: any) => boolean | string;
}
export declare class ValidationService {
    static validateRequired(req: Request, res: Response, fields: string[]): boolean;
    static validateLength(req: Request, res: Response, field: string, minLength: number, maxLength?: number): boolean;
    static validateEnum(req: Request, res: Response, field: string, allowedValues: string[]): boolean;
    static validatePattern(req: Request, res: Response, field: string, pattern: RegExp, message?: string): boolean;
    static validateNumberRange(req: Request, res: Response, field: string, min: number, max: number): boolean;
    static validateBoolean(req: Request, res: Response, field: string): boolean;
    static createValidator(rules: ValidationRule[]): (req: Request, res: Response, next: NextFunction) => void;
}
export declare const ValidationRules: {
    userCreation: (req: Request, res: Response, next: NextFunction) => void;
    shopOwnerCreation: (req: Request, res: Response, next: NextFunction) => void;
    shopCreation: (req: Request, res: Response, next: NextFunction) => void;
    passwordReset: (req: Request, res: Response, next: NextFunction) => void;
    statusUpdate: (req: Request, res: Response, next: NextFunction) => void;
};
export {};
//# sourceMappingURL=validationService.d.ts.map