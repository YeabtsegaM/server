"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseService = void 0;
// Response service class following Factory pattern
class ResponseService {
    // Success responses
    static success(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            data
        };
        if (message) {
            response.message = message;
        }
        res.status(statusCode).json(response);
    }
    static created(res, data, message) {
        this.success(res, data, message, 201);
    }
    static updated(res, data, message) {
        this.success(res, data, message, 200);
    }
    static deleted(res, message) {
        this.success(res, null, message || 'Deleted successfully', 200);
    }
    // Error responses
    static error(res, message, statusCode = 500) {
        const response = {
            success: false,
            error: message
        };
        res.status(statusCode).json(response);
    }
    static badRequest(res, message) {
        this.error(res, message, 400);
    }
    static unauthorized(res, message = 'Unauthorized') {
        this.error(res, message, 401);
    }
    static forbidden(res, message = 'Access denied') {
        this.error(res, message, 403);
    }
    static locked(res, message = 'Account is locked') {
        this.error(res, message, 423);
    }
    static notFound(res, resource) {
        this.error(res, `${resource} not found`, 404);
    }
    static validationError(res, message) {
        this.error(res, message, 400);
    }
    static serverError(res, message = 'Internal server error') {
        this.error(res, message, 500);
    }
}
exports.ResponseService = ResponseService;
//# sourceMappingURL=responseService.js.map