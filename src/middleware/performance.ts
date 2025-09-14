import { Request, Response, NextFunction } from 'express';

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Monitor response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  // Handle response close event as well
  res.on('close', () => {
    const duration = Date.now() - start;
    
    // Log if request was closed before finishing
    if (duration > 1000) {
      console.warn(`Request closed: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = (): void => {
  const used = process.memoryUsage();
  
  // Memory usage monitoring disabled for cleaner logs
};

// Database query performance monitoring
export const queryMonitor = (operation: string, duration: number): void => {
  if (duration > 100) { // Log queries taking more than 100ms
    console.warn(`Slow DB query: ${operation} - ${duration}ms`);
  }
}; 