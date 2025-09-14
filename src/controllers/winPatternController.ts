import { Request, Response } from 'express';
import { WinPattern, IWinPattern } from '../models/WinPattern';
import { ResponseService } from '../services/responseService';

// Get all win patterns for a cashier
export const getWinPatterns = async (req: Request, res: Response) => {
  try {
    const { cashierId, shopId } = req.query;
    
    if (!cashierId) {
      return ResponseService.badRequest(res, 'Cashier ID is required');
    }

    const query: any = { cashierId: cashierId as string };
    
    // If shopId is provided, include it in the query
    if (shopId) {
      query.shopId = shopId;
    }

    const patterns = await WinPattern.find(query).sort({ createdAt: -1 });
    
    // Transform _id to id for frontend compatibility
    const transformedPatterns = patterns.map(pattern => {
      const patternObj = pattern.toObject();
      return {
        ...patternObj,
        id: patternObj._id,
        _id: undefined
      };
    });
    
    ResponseService.success(res, transformedPatterns, 'Win patterns retrieved successfully');
  } catch (error) {
    console.error('Error getting win patterns:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Get a single win pattern by ID
export const getWinPattern = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pattern = await WinPattern.findById(id);
    
    if (!pattern) {
      return ResponseService.notFound(res, 'Win pattern');
    }
    
    // Transform _id to id for frontend compatibility
    const patternObj = pattern.toObject();
    const transformedPattern = {
      ...patternObj,
      id: patternObj._id,
      _id: undefined
    };
    
    ResponseService.success(res, transformedPattern, 'Win pattern retrieved successfully');
  } catch (error) {
    console.error('Error getting win pattern:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Create a new win pattern
export const createWinPattern = async (req: Request, res: Response) => {
  try {
    const { name, pattern, isActive, cashierId, shopId } = req.body;
    
    // Validate required fields
    if (!name || !pattern || !cashierId) {
      return ResponseService.badRequest(res, 'Name, pattern, and cashierId are required');
    }
    
    // Validate pattern structure
    if (!Array.isArray(pattern) || pattern.length !== 5 || 
        !pattern.every(row => Array.isArray(row) && row.length === 5)) {
      return ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
    }
    
    // Check if pattern name already exists for this cashier
    const existingPatternByName = await WinPattern.findOne({ 
      cashierId, 
      name: name.trim() 
    });
    
    if (existingPatternByName) {
      return ResponseService.error(res, 'Pattern name already exists', 409);
    }

    // Check if pattern design already exists for this cashier
    const existingPatternByDesign = await WinPattern.findOne({ 
      cashierId, 
      pattern: pattern 
    });
    
    if (existingPatternByDesign) {
      return ResponseService.error(res, 'Pattern design already exists', 409);
    }
    
    const newPattern = new WinPattern({
      name: name.trim(),
      pattern,
      isActive: isActive !== undefined ? isActive : true,
      cashierId,
      shopId
    });
    
    const savedPattern = await newPattern.save();
    
    // Transform _id to id for frontend compatibility
    const patternObj = savedPattern.toObject();
    const transformedPattern = {
      ...patternObj,
      id: patternObj._id,
      _id: undefined
    };
    
    // Emit real-time update
    req.app.locals.io?.emit('win-pattern:created', {
      pattern: transformedPattern,
      cashierId
    });
    
    ResponseService.created(res, transformedPattern, 'Win pattern created successfully');
  } catch (error: any) {
    console.error('Error creating win pattern:', error);
    if (error.code === 11000) {
      return ResponseService.error(res, 'A pattern with this name already exists for this cashier', 409);
    }
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Update a win pattern
export const updateWinPattern = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, pattern, isActive } = req.body;
    
    const existingPattern = await WinPattern.findById(id);
    
    if (!existingPattern) {
      return ResponseService.notFound(res, 'Win pattern');
    }
    
    // If name is being updated, check for duplicate names
    if (name && name !== existingPattern.name) {
      const duplicatePatternByName = await WinPattern.findOne({
        cashierId: existingPattern.cashierId,
        name: name.trim(),
        _id: { $ne: id }
      });
      
      if (duplicatePatternByName) {
        return ResponseService.error(res, 'Pattern name already exists', 409);
      }
    }

    // If pattern is being updated, check for duplicate designs
    if (pattern && JSON.stringify(pattern) !== JSON.stringify(existingPattern.pattern)) {
      const duplicatePatternByDesign = await WinPattern.findOne({
        cashierId: existingPattern.cashierId,
        pattern: pattern,
        _id: { $ne: id }
      });
      
      if (duplicatePatternByDesign) {
        return ResponseService.error(res, 'Pattern design already exists', 409);
      }
    }
    
    // Validate pattern structure if provided
    if (pattern && (!Array.isArray(pattern) || pattern.length !== 5 || 
        !pattern.every(row => Array.isArray(row) && row.length === 5))) {
      return ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (pattern !== undefined) updateData.pattern = pattern;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedPattern = await WinPattern.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedPattern) {
      return ResponseService.notFound(res, 'Win pattern');
    }
    
    // Transform _id to id for frontend compatibility
    const patternObj = updatedPattern.toObject();
    const transformedPattern = {
      ...patternObj,
      id: patternObj._id,
      _id: undefined
    };
    
    // Emit real-time update
    req.app.locals.io?.emit('win-pattern:updated', {
      pattern: transformedPattern,
      cashierId: existingPattern.cashierId
    });
    
    ResponseService.updated(res, transformedPattern, 'Win pattern updated successfully');
  } catch (error: any) {
    console.error('Error updating win pattern:', error);
    if (error.code === 11000) {
      return ResponseService.error(res, 'A pattern with this name already exists for this cashier', 409);
    }
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Delete a win pattern
export const deleteWinPattern = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pattern = await WinPattern.findById(id);
    
    if (!pattern) {
      return ResponseService.notFound(res, 'Win pattern');
    }
    
    await WinPattern.findByIdAndDelete(id);
    
    // Emit real-time update
    req.app.locals.io?.emit('win-pattern:deleted', {
      patternId: id,
      cashierId: pattern.cashierId
    });
    
    ResponseService.deleted(res, 'Win pattern deleted successfully');
  } catch (error: any) {
    console.error('Error deleting win pattern:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Toggle pattern active status
export const toggleWinPatternStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const pattern = await WinPattern.findById(id);
    
    if (!pattern) {
      return ResponseService.notFound(res, 'Win pattern');
    }
    
    const updatedPattern = await WinPattern.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    
    if (!updatedPattern) {
      return ResponseService.notFound(res, 'Win pattern');
    }
    
    // Transform _id to id for frontend compatibility
    const patternObj = updatedPattern.toObject();
    const transformedPattern = {
      ...patternObj,
      id: patternObj._id,
      _id: undefined
    };
    
    // Emit real-time update
    req.app.locals.io?.emit('win-pattern:status-changed', {
      pattern: transformedPattern,
      cashierId: pattern.cashierId
    });
    
    ResponseService.updated(res, transformedPattern, 'Win pattern status updated successfully');
  } catch (error: any) {
    console.error('Error toggling win pattern status:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Get active win patterns for a cashier (for game use)
export const getActiveWinPatterns = async (req: Request, res: Response) => {
  try {
    const { cashierId, shopId } = req.query;
    
    if (!cashierId) {
      return ResponseService.badRequest(res, 'Cashier ID is required');
    }

    const query: any = { 
      cashierId: cashierId as string,
      isActive: true 
    };
    
    if (shopId) {
      query.shopId = shopId;
    }

    const patterns = await WinPattern.find(query).select('name pattern').sort({ name: 1 });
    
    // Transform _id to id for frontend compatibility
    const transformedPatterns = patterns.map(pattern => {
      const patternObj = pattern.toObject();
      return {
        ...patternObj,
        id: patternObj._id,
        _id: undefined
      };
    });
    
    ResponseService.success(res, transformedPatterns, 'Active win patterns retrieved successfully');
  } catch (error: any) {
    console.error('Error getting active win patterns:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
}; 