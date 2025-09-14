import { Request, Response } from 'express';
import { Cartela, ICartela } from '../models/Cartela';
import { ResponseService } from '../services/responseService';

// Get all cartelas for a cashier or all cartelas if no cashierId provided
export const getCartelas = async (req: Request, res: Response) => {
  try {
    const { cashierId, shopId } = req.query;
    
    let query: any = {};
    
    // If cashierId is provided, filter by cashier
    if (cashierId) {
      query.cashierId = cashierId as string;
    }
    
    // If shopId is provided, include it in the query
    if (shopId) {
      query.shopId = shopId;
    }

    const cartelas = await Cartela.find(query).sort({ cartelaId: 1 });
    
    // Transform _id to id for frontend compatibility
    const transformedCartelas = cartelas.map(cartela => {
      const cartelaObj = cartela.toObject();
      return {
        ...cartelaObj,
        id: cartelaObj._id,
        _id: undefined
      };
    });
    
    ResponseService.success(res, transformedCartelas, 'Cartelas retrieved successfully');
  } catch (error) {
    console.error('Error getting cartelas:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Get cartelas for display (public access, no authentication required)
export const getCartelasForDisplay = async (req: Request, res: Response) => {
  try {
    // For display, we need to get cartelas from the specific game session
    // The sessionId should be the displayToken from the Game model
    const { sessionId } = req.query;
    
    console.log('🔍 Display cartelas request - sessionId:', sessionId);
    console.log('🔍 Request query:', req.query);
    
    if (!sessionId) {
      console.log('❌ No sessionId provided');
      return ResponseService.badRequest(res, 'Session ID is required for display');
    }
    
    // First, find the game associated with this displayToken
    const Game = (await import('../models/Game')).default;
    console.log('🔍 Searching for game with displayToken:', sessionId);
    
    const game = await Game.findOne({ 
      displayToken: sessionId,
      status: 'waiting' 
    }).sort({ lastActivity: -1 });
    
    if (!game) {
      console.log('❌ No waiting game found for displayToken:', sessionId);
      return ResponseService.badRequest(res, 'No waiting game found for this display token');
    }
    
    if (!game.cashierId) {
      console.log('❌ Game found but no cashier assigned yet');
      return ResponseService.badRequest(res, 'Game session found but no cashier assigned yet');
    }
    
    // Get cartelas for the cashier from the game
    console.log('🔍 Fetching cartelas for cashierId:', game.cashierId);
    const cartelas = await Cartela.find({ 
      cashierId: game.cashierId,
      isActive: true 
    }).sort({ cartelaId: 1 });
    
    console.log('🔍 Found cartelas count:', cartelas.length);
    
    // Transform _id to id for frontend compatibility
    const transformedCartelas = cartelas.map(cartela => {
      const cartelaObj = cartela.toObject();
      return {
        ...cartelaObj,
        id: cartelaObj._id,
        _id: undefined
      };
    });
    
    ResponseService.success(res, transformedCartelas, 'Cartelas retrieved successfully for display');
  } catch (error) {
    console.error('❌ Error getting cartelas for display:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Get a single cartela by ID
export const getCartela = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const cartela = await Cartela.findById(id);
    
    if (!cartela) {
      return ResponseService.notFound(res, 'Cartela');
    }
    
    // Transform _id to id for frontend compatibility
    const cartelaObj = cartela.toObject();
    const transformedCartela = {
      ...cartelaObj,
      id: cartelaObj._id,
      _id: undefined
    };
    
    ResponseService.success(res, transformedCartela, 'Cartela retrieved successfully');
  } catch (error) {
    console.error('Error getting cartela:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Create a new cartela
export const createCartela = async (req: Request, res: Response) => {
  try {
    const { cartelaId, pattern, isActive, cashierId, shopId } = req.body;
    
    // Validate required fields
    if (!cartelaId || !pattern || !cashierId) {
      return ResponseService.badRequest(res, 'Cartela ID, pattern, and cashierId are required');
    }
    
    // Validate cartelaId range
    if (cartelaId < 1 || cartelaId > 210) {
      return ResponseService.badRequest(res, 'Cartela ID must be between 1 and 210');
    }
    
    // Validate pattern structure
    if (!Array.isArray(pattern) || pattern.length !== 5 || 
        !pattern.every(row => Array.isArray(row) && row.length === 5)) {
      return ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
    }
    
    // Check if cartelaId already exists for this cashier
    const existingCartela = await Cartela.findOne({ 
      cashierId, 
      cartelaId: cartelaId 
    });
    
    if (existingCartela) {
      return ResponseService.error(res, 'Cartela ID already exists', 409);
    }
    
    // Check if cashier has reached the limit of 210 cartelas
    const cartelaCount = await Cartela.countDocuments({ cashierId });
    if (cartelaCount >= 210) {
      return ResponseService.error(res, 'Maximum limit of 210 cartelas reached', 409);
    }
    
    const newCartela = new Cartela({
      cartelaId,
      pattern,
      isActive: isActive !== undefined ? isActive : true,
      cashierId,
      shopId
    });
    
    const savedCartela = await newCartela.save();
    
    // Transform _id to id for frontend compatibility
    const cartelaObj = savedCartela.toObject();
    const transformedCartela = {
      ...cartelaObj,
      id: cartelaObj._id,
      _id: undefined
    };
    
    // Emit real-time update
    req.app.locals.io?.emit('cartela:created', {
      cartela: transformedCartela,
      cashierId
    });
    
    ResponseService.created(res, transformedCartela, 'Cartela created successfully');
  } catch (error: any) {
    console.error('Error creating cartela:', error);
    if (error.code === 11000) {
      return ResponseService.error(res, 'Cartela ID already exists', 409);
    }
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Update a cartela
export const updateCartela = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cartelaId, pattern, isActive } = req.body;
    
    const existingCartela = await Cartela.findById(id);
    
    if (!existingCartela) {
      return ResponseService.notFound(res, 'Cartela');
    }
    
    // If cartelaId is being updated, check for duplicates
    if (cartelaId && cartelaId !== existingCartela.cartelaId) {
      const duplicateCartela = await Cartela.findOne({
        cashierId: existingCartela.cashierId,
        cartelaId: cartelaId,
        _id: { $ne: id }
      });
      
      if (duplicateCartela) {
        return ResponseService.error(res, 'Cartela ID already exists', 409);
      }
    }
    
    // Validate cartelaId range if provided
    if (cartelaId && (cartelaId < 1 || cartelaId > 210)) {
      return ResponseService.badRequest(res, 'Cartela ID must be between 1 and 210');
    }
    
    // Validate pattern structure if provided
    if (pattern && (!Array.isArray(pattern) || pattern.length !== 5 || 
        !pattern.every(row => Array.isArray(row) && row.length === 5))) {
      return ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
    }
    
    const updateData: any = {};
    if (cartelaId !== undefined) updateData.cartelaId = cartelaId;
    if (pattern !== undefined) updateData.pattern = pattern;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedCartela = await Cartela.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedCartela) {
      return ResponseService.notFound(res, 'Cartela');
    }
    
    // Transform _id to id for frontend compatibility
    const cartelaObj = updatedCartela.toObject();
    const transformedCartela = {
      ...cartelaObj,
      id: cartelaObj._id,
      _id: undefined
    };
    
    // Emit real-time update
    req.app.locals.io?.emit('cartela:updated', {
      cartela: transformedCartela,
      cashierId: existingCartela.cashierId
    });
    
    ResponseService.success(res, transformedCartela, 'Cartela updated successfully');
  } catch (error: any) {
    console.error('Error updating cartela:', error);
    if (error.code === 11000) {
      return ResponseService.error(res, 'Cartela ID already exists', 409);
    }
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Delete a cartela
export const deleteCartela = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const cartela = await Cartela.findById(id);
    
    if (!cartela) {
      return ResponseService.notFound(res, 'Cartela');
    }
    
    await Cartela.findByIdAndDelete(id);
    
    // Emit real-time update
    req.app.locals.io?.emit('cartela:deleted', {
      cartelaId: id,
      cashierId: cartela.cashierId
    });
    
    ResponseService.success(res, null, 'Cartela deleted successfully');
  } catch (error) {
    console.error('Error deleting cartela:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Toggle cartela active status
export const toggleCartelaStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const cartela = await Cartela.findById(id);
    
    if (!cartela) {
      return ResponseService.notFound(res, 'Cartela');
    }
    
    cartela.isActive = isActive;
    await cartela.save();
    
    // Transform _id to id for frontend compatibility
    const cartelaObj = cartela.toObject();
    const transformedCartela = {
      ...cartelaObj,
      id: cartelaObj._id,
      _id: undefined
    };
    
    // Emit real-time update
    req.app.locals.io?.emit('cartela:status-changed', {
      cartela: transformedCartela,
      cashierId: cartela.cashierId
    });
    
    ResponseService.success(res, transformedCartela, 'Cartela status updated successfully');
  } catch (error) {
    console.error('Error toggling cartela status:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
};

// Get active cartelas for a cashier
export const getActiveCartelas = async (req: Request, res: Response) => {
  try {
    const { cashierId, shopId } = req.query;
    
    if (!cashierId) {
      return ResponseService.badRequest(res, 'Cashier ID is required');
    }

    const query: any = { 
      cashierId: cashierId as string,
      isActive: true
    };
    
    // If shopId is provided, include it in the query
    if (shopId) {
      query.shopId = shopId;
    }

    const cartelas = await Cartela.find(query).sort({ cartelaId: 1 });
    
    // Transform _id to id for frontend compatibility
    const transformedCartelas = cartelas.map(cartela => {
      const cartelaObj = cartela.toObject();
      return {
        ...cartelaObj,
        id: cartelaObj._id,
        _id: undefined
      };
    });
    
    ResponseService.success(res, transformedCartelas, 'Active cartelas retrieved successfully');
  } catch (error) {
    console.error('Error getting active cartelas:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
}; 

// Get a single cartela by cartelaId number (for printing)
export const getCartelaByCartelaId = async (req: Request, res: Response) => {
  try {
    const { cartelaId, cashierId } = req.params;
    
    if (!cartelaId || !cashierId) {
      return ResponseService.badRequest(res, 'Cartela ID and Cashier ID are required');
    }

    const cartela = await Cartela.findOne({ 
      cartelaId: parseInt(cartelaId), 
      cashierId,
      isActive: true 
    });
    
    if (!cartela) {
      return ResponseService.notFound(res, 'Cartela not found or inactive');
    }
    
    // Transform _id to id for frontend compatibility
    const cartelaObj = cartela.toObject();
    const transformedCartela = {
      ...cartelaObj,
      id: cartelaObj._id,
      _id: undefined
    };
    
    ResponseService.success(res, transformedCartela, 'Cartela retrieved successfully');
  } catch (error) {
    console.error('Error getting cartela by cartelaId:', error);
    ResponseService.serverError(res, 'Internal server error');
  }
}; 