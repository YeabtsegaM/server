import { Response } from 'express';

// Standard response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Response service class following Factory pattern
export class ResponseService {
  // Success responses
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data
    };
    
    if (message) {
      response.message = message;
    }
    
    res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): void {
    this.success(res, data, message, 201);
  }

  static updated<T>(res: Response, data: T, message?: string): void {
    this.success(res, data, message, 200);
  }

  static deleted(res: Response, message?: string): void {
    this.success(res, null, message || 'Deleted successfully', 200);
  }

  // Error responses
  static error(res: Response, message: string, statusCode: number = 500): void {
    const response: ApiResponse = {
      success: false,
      error: message
    };
    
    res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string): void {
    this.error(res, message, 400);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Access denied'): void {
    this.error(res, message, 403);
  }

  static locked(res: Response, message: string = 'Account is locked'): void {
    this.error(res, message, 423);
  }

  static notFound(res: Response, resource: string): void {
    this.error(res, `${resource} not found`, 404);
  }

  static validationError(res: Response, message: string): void {
    this.error(res, message, 400);
  }

  static serverError(res: Response, message: string = 'Internal server error'): void {
    this.error(res, message, 500);
  }
} 