"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const responseService_1 = require("./responseService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 0; // Disabled for real-time updates - no caching delay
// Database service class following Repository pattern
class DatabaseService {
    // Generic find by ID with error handling and caching
    static async findById(model, id, res, resourceName, select, useCache = false // Disabled cache by default for real-time
    ) {
        try {
            // Skip cache for real-time updates
            const result = await model.findById(id).select(select || '-__v');
            if (!result) {
                responseService_1.ResponseService.notFound(res, resourceName);
                return null;
            }
            return result;
        }
        catch (error) {
            console.error(`Error finding ${resourceName} by ID:`, error);
            responseService_1.ResponseService.serverError(res, `Failed to find ${resourceName}`);
            return null;
        }
    }
    // Generic find all with error handling and optimization
    static async findAll(model, res, resourceName, options = {}) {
        try {
            // Skip cache for real-time updates
            let query = model.find(options.filter || {});
            if (options.select) {
                query = query.select(options.select);
            }
            if (options.sort) {
                query = query.sort(options.sort);
            }
            if (options.populate) {
                query = query.populate(options.populate);
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            const results = await query;
            return results;
        }
        catch (error) {
            console.error(`Error finding ${resourceName}:`, error);
            responseService_1.ResponseService.serverError(res, `Failed to find ${resourceName}`);
            return null;
        }
    }
    // Clear cache for a specific resource
    static clearCache(resourceName) {
        if (resourceName) {
            // Clear specific resource cache
            for (const key of cache.keys()) {
                if (key.startsWith(`${resourceName}:`)) {
                    cache.delete(key);
                }
            }
        }
        else {
            // Clear all cache
            cache.clear();
        }
    }
    // Clear cache for specific item
    static clearItemCache(resourceName, itemId) {
        // Clear individual item cache
        for (const key of cache.keys()) {
            if (key.includes(`${resourceName}:${itemId}`)) {
                cache.delete(key);
            }
        }
        // Also clear list cache for this resource
        for (const key of cache.keys()) {
            if (key.includes(`${resourceName}:list`)) {
                cache.delete(key);
            }
        }
    }
    // Generic create with error handling
    static async create(model, data, res, resourceName, transformData) {
        try {
            const result = new model(data);
            await result.save();
            // Clear cache for this resource type
            this.clearCache(resourceName);
            const responseData = transformData ? transformData(result) : result;
            responseService_1.ResponseService.created(res, responseData);
            return result;
        }
        catch (error) {
            console.error(`Error creating ${resourceName}:`, error);
            responseService_1.ResponseService.serverError(res, `Failed to create ${resourceName}`);
            return null;
        }
    }
    // Generic update with error handling
    static async updateById(model, id, updateData, res, resourceName, options = {}) {
        try {
            let query = model.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
                ...options
            });
            if (options.select) {
                query = query.select(options.select);
            }
            if (options.populate) {
                query = query.populate(options.populate);
            }
            const result = await query;
            if (!result) {
                responseService_1.ResponseService.notFound(res, resourceName);
                return null;
            }
            // Clear cache for this specific item and related lists
            this.clearItemCache(resourceName, id);
            return result;
        }
        catch (error) {
            console.error(`Error updating ${resourceName}:`, error);
            responseService_1.ResponseService.serverError(res, `Failed to update ${resourceName}`);
            return null;
        }
    }
    // Generic delete with error handling
    static async deleteById(model, id, res, resourceName) {
        try {
            const result = await model.findByIdAndDelete(id);
            if (!result) {
                responseService_1.ResponseService.notFound(res, resourceName);
                return false;
            }
            // Clear cache for this specific item and related lists
            this.clearItemCache(resourceName, id);
            responseService_1.ResponseService.deleted(res, `${resourceName} deleted successfully`);
            return true;
        }
        catch (error) {
            console.error(`Error deleting ${resourceName}:`, error);
            responseService_1.ResponseService.serverError(res, `Failed to delete ${resourceName}`);
            return false;
        }
    }
    // Check if document exists
    static async exists(model, filter, res, resourceName, errorMessage) {
        try {
            const exists = await model.exists(filter);
            if (exists) {
                responseService_1.ResponseService.badRequest(res, errorMessage);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Error checking ${resourceName} existence:`, error);
            responseService_1.ResponseService.serverError(res, `Failed to check ${resourceName}`);
            return true; // Assume exists to prevent creation
        }
    }
    // Hash password utility
    static async hashPassword(password, saltRounds = 12) {
        return await bcryptjs_1.default.hash(password, saltRounds);
    }
    // Compare password utility
    static async comparePassword(password, hash) {
        return await bcryptjs_1.default.compare(password, hash);
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=databaseService.js.map