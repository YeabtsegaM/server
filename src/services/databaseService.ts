import { Response } from 'express';
import { ResponseService } from './responseService';
import bcrypt from 'bcryptjs';

// Type definitions for better type safety
interface BaseDocument {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserDocument extends BaseDocument {
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  password?: string;
}

interface ShopDocument extends BaseDocument {
  shopName: string;
  location: string;
  owner: any;
  margin: number;
  billingType: string;
  prepaidBalance: number;
  systemRevenuePercentage: number;
  status: string;
  bingoGameNumber: number;
}

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 0; // Disabled for real-time updates - no caching delay

// Database service class following Repository pattern
export class DatabaseService {
  // Generic find by ID with error handling and caching
  static async findById<T extends BaseDocument>(
    model: any,
    id: string,
    res: Response,
    resourceName: string,
    select?: string,
    useCache: boolean = false // Disabled cache by default for real-time
  ): Promise<T | null> {
    try {
      // Skip cache for real-time updates
      const result = await model.findById(id).select(select || '-__v');
      
      if (!result) {
        ResponseService.notFound(res, resourceName);
        return null;
      }
      
      return result as T;
    } catch (error) {
      console.error(`Error finding ${resourceName} by ID:`, error);
      ResponseService.serverError(res, `Failed to find ${resourceName}`);
      return null;
    }
  }

  // Generic find all with error handling and optimization
  static async findAll<T extends BaseDocument>(
    model: any,
    res: Response,
    resourceName: string,
    options: {
      select?: string;
      sort?: any;
      populate?: any;
      filter?: any;
      limit?: number;
      useCache?: boolean;
    } = {}
  ): Promise<T[] | null> {
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
      return results as T[];
    } catch (error) {
      console.error(`Error finding ${resourceName}:`, error);
      ResponseService.serverError(res, `Failed to find ${resourceName}`);
      return null;
    }
  }

  // Clear cache for a specific resource
  static clearCache(resourceName?: string): void {
    if (resourceName) {
      // Clear specific resource cache
      for (const key of cache.keys()) {
        if (key.startsWith(`${resourceName}:`)) {
          cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      cache.clear();
    }
  }

  // Clear cache for specific item
  static clearItemCache(resourceName: string, itemId: string): void {
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
  static async create<T extends BaseDocument>(
    model: any,
    data: any,
    res: Response,
    resourceName: string,
    transformData?: (data: T) => any
  ): Promise<T | null> {
    try {
      const result = new model(data);
      await result.save();
      
      // Clear cache for this resource type
      this.clearCache(resourceName);
      
      const responseData = transformData ? transformData(result as T) : result;
      ResponseService.created(res, responseData);
      
      return result as T;
    } catch (error) {
      console.error(`Error creating ${resourceName}:`, error);
      ResponseService.serverError(res, `Failed to create ${resourceName}`);
      return null;
    }
  }

  // Generic update with error handling
  static async updateById<T extends BaseDocument>(
    model: any,
    id: string,
    updateData: any,
    res: Response,
    resourceName: string,
    options: {
      new?: boolean;
      runValidators?: boolean;
      select?: string;
      populate?: any;
    } = {}
  ): Promise<T | null> {
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
        ResponseService.notFound(res, resourceName);
        return null;
      }
      
      // Clear cache for this specific item and related lists
      this.clearItemCache(resourceName, id);
      
      return result as T;
    } catch (error) {
      console.error(`Error updating ${resourceName}:`, error);
      ResponseService.serverError(res, `Failed to update ${resourceName}`);
      return null;
    }
  }

  // Generic delete with error handling
  static async deleteById(
    model: any,
    id: string,
    res: Response,
    resourceName: string
  ): Promise<boolean> {
    try {
      const result = await model.findByIdAndDelete(id);
      
      if (!result) {
        ResponseService.notFound(res, resourceName);
        return false;
      }
      
      // Clear cache for this specific item and related lists
      this.clearItemCache(resourceName, id);
      
      ResponseService.deleted(res, `${resourceName} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting ${resourceName}:`, error);
      ResponseService.serverError(res, `Failed to delete ${resourceName}`);
      return false;
    }
  }

  // Check if document exists
  static async exists(
    model: any,
    filter: any,
    res: Response,
    resourceName: string,
    errorMessage: string
  ): Promise<boolean> {
    try {
      const exists = await model.exists(filter);
      
      if (exists) {
        ResponseService.badRequest(res, errorMessage);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking ${resourceName} existence:`, error);
      ResponseService.serverError(res, `Failed to check ${resourceName}`);
      return true; // Assume exists to prevent creation
    }
  }

  // Hash password utility
  static async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password utility
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
} 