"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationRules = exports.ValidationService = void 0;
const responseService_1 = require("./responseService");
// Validation service class
class ValidationService {
    // Validate required fields
    static validateRequired(req, res, fields) {
        for (const field of fields) {
            if (!req.body[field] || req.body[field].toString().trim() === '') {
                responseService_1.ResponseService.validationError(res, `${field} is required`);
                return false;
            }
        }
        return true;
    }
    // Validate field length
    static validateLength(req, res, field, minLength, maxLength) {
        const value = req.body[field];
        if (!value)
            return true; // Skip if not required
        if (value.length < minLength) {
            responseService_1.ResponseService.validationError(res, `${field} must be at least ${minLength} characters long`);
            return false;
        }
        if (maxLength && value.length > maxLength) {
            responseService_1.ResponseService.validationError(res, `${field} must be no more than ${maxLength} characters long`);
            return false;
        }
        return true;
    }
    // Validate enum values
    static validateEnum(req, res, field, allowedValues) {
        const value = req.body[field];
        if (!value)
            return true; // Skip if not required
        if (!allowedValues.includes(value)) {
            responseService_1.ResponseService.validationError(res, `${field} must be one of: ${allowedValues.join(', ')}`);
            return false;
        }
        return true;
    }
    // Validate pattern
    static validatePattern(req, res, field, pattern, message) {
        const value = req.body[field];
        if (!value)
            return true; // Skip if not required
        if (!pattern.test(value)) {
            responseService_1.ResponseService.validationError(res, message || `${field} format is invalid`);
            return false;
        }
        return true;
    }
    // Validate number range
    static validateNumberRange(req, res, field, min, max) {
        const value = req.body[field];
        if (!value)
            return true; // Skip if not required
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
        if (isNaN(numValue) || numValue < min || numValue > max) {
            responseService_1.ResponseService.validationError(res, `${field} must be between ${min} and ${max}`);
            return false;
        }
        return true;
    }
    // Validate boolean
    static validateBoolean(req, res, field) {
        const value = req.body[field];
        if (value === undefined || value === null)
            return true; // Skip if not required
        if (typeof value !== 'boolean') {
            responseService_1.ResponseService.validationError(res, `${field} must be a boolean value`);
            return false;
        }
        return true;
    }
    // Create validation middleware
    static createValidator(rules) {
        return (req, res, next) => {
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
                        responseService_1.ResponseService.validationError(res, typeof result === 'string' ? result : `${rule.field} is invalid`);
                        return;
                    }
                }
            }
            next();
        };
    }
}
exports.ValidationService = ValidationService;
// Predefined validation rules
exports.ValidationRules = {
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
            } },
        { field: 'systemRevenuePercentage', custom: (value) => {
                const num = typeof value === 'string' ? parseInt(value, 10) : value;
                return (num >= 5 && num <= 20) || 'System revenue percentage must be between 5% and 20%';
            } }
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
//# sourceMappingURL=validationService.js.map