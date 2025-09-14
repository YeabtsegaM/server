import { Request, Response, NextFunction } from 'express';
import { ResponseService } from './responseService';

// Validation rules interface
interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
}

// Validation service class
export class ValidationService {
  // Validate required fields
  static validateRequired(req: Request, res: Response, fields: string[]): boolean {
    for (const field of fields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        ResponseService.validationError(res, `${field} is required`);
        return false;
      }
    }
    return true;
  }

  // Validate field length
  static validateLength(req: Request, res: Response, field: string, minLength: number, maxLength?: number): boolean {
    const value = req.body[field];
    if (!value) return true; // Skip if not required

    if (value.length < minLength) {
      ResponseService.validationError(res, `${field} must be at least ${minLength} characters long`);
      return false;
    }

    if (maxLength && value.length > maxLength) {
      ResponseService.validationError(res, `${field} must be no more than ${maxLength} characters long`);
      return false;
    }

    return true;
  }

  // Validate enum values
  static validateEnum(req: Request, res: Response, field: string, allowedValues: string[]): boolean {
    const value = req.body[field];
    if (!value) return true; // Skip if not required

    if (!allowedValues.includes(value)) {
      ResponseService.validationError(res, `${field} must be one of: ${allowedValues.join(', ')}`);
      return false;
    }

    return true;
  }

  // Validate pattern
  static validatePattern(req: Request, res: Response, field: string, pattern: RegExp, message?: string): boolean {
    const value = req.body[field];
    if (!value) return true; // Skip if not required

    if (!pattern.test(value)) {
      ResponseService.validationError(res, message || `${field} format is invalid`);
      return false;
    }

    return true;
  }

  // Validate number range
  static validateNumberRange(req: Request, res: Response, field: string, min: number, max: number): boolean {
    const value = req.body[field];
    if (!value) return true; // Skip if not required

    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(numValue) || numValue < min || numValue > max) {
      ResponseService.validationError(res, `${field} must be between ${min} and ${max}`);
      return false;
    }

    return true;
  }

  // Validate boolean
  static validateBoolean(req: Request, res: Response, field: string): boolean {
    const value = req.body[field];
    if (value === undefined || value === null) return true; // Skip if not required

    if (typeof value !== 'boolean') {
      ResponseService.validationError(res, `${field} must be a boolean value`);
      return false;
    }

    return true;
  }

  // Create validation middleware
  static createValidator(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      for (const rule of rules) {
        // Required validation
        if (rule.required && !this.validateRequired(req, res, [rule.field])) {
          return;
        }

        // Length validation
        if (rule.minLength || rule.maxLength) {
          if (!this.validateLength(req, res, rule.field, rule.minLength || 0, rule.maxLength)) {
            return;
          }
        }

        // Enum validation
        if (rule.enum) {
          if (!this.validateEnum(req, res, rule.field, rule.enum)) {
            return;
          }
        }

        // Pattern validation
        if (rule.pattern) {
          if (!this.validatePattern(req, res, rule.field, rule.pattern)) {
            return;
          }
        }

        // Custom validation
        if (rule.custom) {
          const result = rule.custom(req.body[rule.field]);
          if (result !== true) {
            ResponseService.validationError(res, typeof result === 'string' ? result : `${rule.field} is invalid`);
            return;
          }
        }
      }

      next();
    };
  }
}

// Predefined validation rules
export const ValidationRules = {
  // User validation
  userCreation: ValidationService.createValidator([
    { field: 'username', required: true, minLength: 3, maxLength: 30, pattern: /^[a-zA-Z0-9_]+$/ },
    { field: 'password', required: true, minLength: 6 },
    { field: 'fullName', required: true, minLength: 2, maxLength: 100 },
    { field: 'role', required: true, enum: ['systemadmin', 'admin', 'shopadmin', 'superagent'] }
  ]),

  // Shop owner validation
  shopOwnerCreation: ValidationService.createValidator([
    { field: 'firstName', required: true, minLength: 2, maxLength: 50 },
    { field: 'lastName', required: true, minLength: 2, maxLength: 50 },
    { field: 'username', required: true, minLength: 3, maxLength: 30, pattern: /^[a-zA-Z0-9_]+$/ },
    { field: 'password', required: true, minLength: 6 }
  ]),

  // Shop validation
  shopCreation: ValidationService.createValidator([
    { field: 'ownerId', required: true },
    { field: 'shopName', required: true, minLength: 2, maxLength: 100 },
    { field: 'location', required: true, minLength: 5, maxLength: 200 },
    { field: 'margin', custom: (value) => {
      const num = typeof value === 'string' ? parseInt(value, 10) : value;
      return (num >= 10 && num <= 45) || 'Margin must be between 10% and 45%';
    }},
    { field: 'systemRevenuePercentage', custom: (value) => {
      const num = typeof value === 'string' ? parseInt(value, 10) : value;
      return (num >= 5 && num <= 20) || 'System revenue percentage must be between 5% and 20%';
    }}
  ]),

  // Password reset validation
  passwordReset: ValidationService.createValidator([
    { field: 'newPassword', required: true, minLength: 6 }
  ]),

  // Status update validation
  statusUpdate: ValidationService.createValidator([
    { field: 'isActive', required: true, custom: (value) => typeof value === 'boolean' }
  ])
}; 