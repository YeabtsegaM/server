import { Request, Response } from 'express';
import ShopOwner from '../models/ShopOwner';
import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';
import { ValidationRules } from '../services/validationService';
import bcrypt from 'bcryptjs';

// Type definitions
interface ShopOwnerDocument {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
}

// Global variable to store socket handler reference
let socketHandler: any = null;

// Function to set socket handler reference
export const setSocketHandler = (io: any) => {
  socketHandler = {
    notifyShopOwnerUpdate: async () => {
      try {
        // Emit shop owner update event to admin clients
        io.to('admin').emit('shopOwner:updated', {
          message: 'Shop owner data updated',
          timestamp: new Date().toISOString()
        });
        console.log('📡 Shop owner update notification sent to admin clients');
      } catch (error) {
        console.error('Error sending shop owner update notification:', error);
      }
    }
  };
};

// Transform shop owner data for consistent response format
const transformShopOwnerData = (shopOwner: ShopOwnerDocument) => ({
  _id: shopOwner._id,
  firstName: shopOwner.firstName,
  lastName: shopOwner.lastName,
  fullName: `${shopOwner.firstName} ${shopOwner.lastName}`,
  username: shopOwner.username,
  isActive: shopOwner.isActive,
  createdAt: shopOwner.createdAt
});

// Get all shop owners - Optimized with service layer
export const getShopOwners = async (req: Request, res: Response): Promise<void> => {
  try {
    const shopOwners = await DatabaseService.findAll<ShopOwnerDocument>(
      ShopOwner,
      res,
      'shop owners',
      {
        select: '-password',
        sort: { createdAt: -1 }
      }
    );

    // Always return an array, even if shopOwners is null
    const shopOwnersArray = shopOwners || [];
    const transformedShopOwners = shopOwnersArray.map(transformShopOwnerData);
    ResponseService.success(res, transformedShopOwners);
  } catch (error) {
    console.error('Error in getShopOwners:', error);
    ResponseService.serverError(res, 'Failed to fetch shop owners');
  }
};

// Create new shop owner - Optimized with service layer
export const createShopOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, username, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !username || !password) {
      ResponseService.validationError(res, 'First name, last name, username, and password are required');
      return;
    }

    // Check if username already exists
    const exists = await DatabaseService.exists(
      ShopOwner,
      { username },
      res,
      'shop owner',
      'Username already exists'
    );

    if (exists) return;

    // Hash password
    const hashedPassword = await DatabaseService.hashPassword(password, 10);

    // Create shop owner
    const shopOwner = await DatabaseService.create<ShopOwnerDocument>(
      ShopOwner,
      {
        firstName,
        lastName,
        username,
        password: hashedPassword,
        isActive: true
      },
      res,
      'shop owner',
      transformShopOwnerData
    );

    if (shopOwner) {
      // Notify dashboard update
      if (socketHandler) {
        await socketHandler.notifyShopOwnerUpdate();
      }
    }
  } catch (error) {
    console.error('Error in createShopOwner:', error);
    ResponseService.serverError(res, 'Failed to create shop owner');
  }
};

// Update shop owner - Optimized with service layer
export const updateShopOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !username) {
      ResponseService.validationError(res, 'First name, last name, and username are required');
      return;
    }

    // Check if username is taken by another shop owner
    const existingShopOwner = await DatabaseService.findById(ShopOwner, id, res, 'shop owner');
    if (!existingShopOwner) return;

    // Check if username is taken by another shop owner
    const usernameExists = await DatabaseService.exists(
      ShopOwner,
      { username, _id: { $ne: id } },
      res,
      'shop owner',
      'Username already exists'
    );

    if (usernameExists) return;

    const updateData: any = { firstName, lastName, username };
    
    // Hash password if provided
    if (password) {
      updateData.password = await DatabaseService.hashPassword(password, 10);
    }

    const shopOwner = await DatabaseService.updateById<ShopOwnerDocument>(
      ShopOwner,
      id,
      updateData,
      res,
      'shop owner',
      {
        select: '-password'
      }
    );

    if (shopOwner) {
      const shopOwnerResponse = transformShopOwnerData(shopOwner);
      
      // Notify dashboard update
      if (socketHandler) {
        await socketHandler.notifyShopOwnerUpdate();
      }

      ResponseService.updated(res, shopOwnerResponse);
    }
  } catch (error) {
    console.error('Error in updateShopOwner:', error);
    ResponseService.serverError(res, 'Failed to update shop owner');
  }
};

// Delete shop owner - Optimized with service layer
export const deleteShopOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteById(ShopOwner, id, res, 'shop owner');
  } catch (error) {
    console.error('Error in deleteShopOwner:', error);
    ResponseService.serverError(res, 'Failed to delete shop owner');
  }
};

// Toggle shop owner status - Optimized with service layer
export const toggleShopOwnerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shopOwner = await DatabaseService.updateById<ShopOwnerDocument>(
      ShopOwner,
      id,
      [{ $set: { isActive: { $not: '$isActive' } } }],
      res,
      'shop owner',
      {
        select: '-password'
      }
    );

    if (shopOwner) {
      const shopOwnerResponse = transformShopOwnerData(shopOwner);
      
      // Notify dashboard update
      if (socketHandler) {
        await socketHandler.notifyShopOwnerUpdate();
      }

      ResponseService.updated(res, shopOwnerResponse);
    }
  } catch (error) {
    console.error('Error in toggleShopOwnerStatus:', error);
    ResponseService.serverError(res, 'Failed to toggle shop owner status');
  }
}; 