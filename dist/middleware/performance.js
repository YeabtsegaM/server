"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryMonitor = exports.memoryMonitor = exports.performanceMonitor = void 0;
// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
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
exports.performanceMonitor = performanceMonitor;
// Memory usage monitoring
const memoryMonitor = () => {
    const used = process.memoryUsage();
    // Memory usage monitoring disabled for cleaner logs
};
exports.memoryMonitor = memoryMonitor;
// Database query performance monitoring
const queryMonitor = (operation, duration) => {
    if (duration > 100) { // Log queries taking more than 100ms
        console.warn(`Slow DB query: ${operation} - ${duration}ms`);
    }
};
exports.queryMonitor = queryMonitor;
//# sourceMappingURL=performance.js.map