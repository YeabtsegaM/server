import { Request, Response } from 'express';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';
import { ValidationRules } from '../services/validationService';
import mongoose from 'mongoose';

// Type definitions
interface ShopDocument {
  _id: string;
  shopName: string;
  location: string;
  owner: mongoose.Types.ObjectId;
  margin: number;
  status: string;
  createdAt: Date;
}

// Global variable to store socket handler reference
let socketHandler: any = null;

// Function to set socket handler reference
export const setSocketHandler = (io: any) => {
  socketHandler = {
    notifyShopUpdate: async () => {
      try {
        // Emit shop update event to admin clients
        io.to('admin').emit('shop:updated', {
          message: 'Shop data updated',
          timestamp: new Date().toISOString()
        });
        console.log('📡 Shop update notification sent to admin clients');
      } catch (error) {
        console.error('Error sending shop update notification:', error);
      }
    }
  };
};

// Transform shop data for consistent response format
const transformShopData = (shop: ShopDocument) => {
  const ownerData = shop.owner as any;
  return {
    _id: shop._id,
    shopName: shop.shopName,
    location: shop.location,
    owner: ownerData ? {
      _id: ownerData._id,
      fullName: ownerData.fullName || `${ownerData.firstName} ${ownerData.lastName}`,
      username: ownerData.username
    } : null,
    margin: shop.margin,
    status: shop.status,
    createdAt: shop.createdAt
  };
};

// Get all shops - Optimized with service layer
export const getShops = async (req: Request, res: Response): Promise<void> => {
  try {
    const shops = await DatabaseService.findAll<ShopDocument>(
      Shop,
      res,
      'shops',
      {
        populate: { path: 'owner', select: 'fullName username firstName lastName' },
        sort: { createdAt: -1 }
      }
    );

    // Always return an array, even if shops is null
    const shopsArray = shops || [];
    const transformedShops = shopsArray.map(transformShopData);
    ResponseService.success(res, transformedShops);
  } catch (error) {
    console.error('Error in getShops:', error);
    ResponseService.serverError(res, 'Failed to fetch shops');
  }
};

// Create a new shop - Optimized with service layer
export const createShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      ownerId,
      shopName,
      location,
      margin = 10,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!ownerId || !shopName || !location) {
      ResponseService.validationError(res, 'Owner, shop name, and location are required');
      return;
    }

    // Convert and validate numeric values
    const marginValue = typeof margin === 'string' ? parseInt(margin, 10) : margin;

    // Validate ranges
    if (marginValue < 5 || marginValue > 50) {
      ResponseService.validationError(res, 'Margin must be between 5% and 50%');
      return;
    }

    // Check if owner exists
    if (ownerId) {
      const ownerExists = await ShopOwner.findById(ownerId);
      if (!ownerExists) {
        ResponseService.notFound(res, 'Owner not found');
        return;
      }
    }

    // Check if shop name already exists
    const exists = await DatabaseService.exists(
      Shop,
      { shopName },
      res,
      'shop',
      'Shop name already exists'
    );

    if (exists) return;

    // Create shop with populated owner
    const shop = await DatabaseService.create<ShopDocument>(
      Shop,
      {
        owner: ownerId,
        shopName,
        location,
        margin: marginValue,
        status: status
      },
      res,
      'shop',
      transformShopData
    );

    if (shop) {
      // Notify dashboard update
      if (socketHandler) {
        await socketHandler.notifyShopUpdate();
      }
    }
  } catch (error) {
    console.error('Error in createShop:', error);
    ResponseService.serverError(res, 'Failed to create shop');
  }
};

// Update a shop - Optimized with service layer
export const updateShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate margin range if margin is being updated
    if (updateData.margin !== undefined) {
      const marginValue = typeof updateData.margin === 'string' ? parseInt(updateData.margin, 10) : updateData.margin;
      if (marginValue < 5 || marginValue > 50) {
        ResponseService.validationError(res, 'Margin must be between 5% and 50%');
        return;
      }
      updateData.margin = marginValue;
    }

    const shop = await DatabaseService.updateById<ShopDocument>(
      Shop,
      id,
      updateData,
      res,
      'shop',
      {
        populate: { path: 'owner', select: 'fullName username firstName lastName' }
      }
    );

    if (shop) {
      const shopResponse = transformShopData(shop);
      
      // Notify dashboard update
      if (socketHandler) {
        await socketHandler.notifyShopUpdate();
      }

      ResponseService.updated(res, shopResponse);
    }
  } catch (error) {
    console.error('Error in updateShop:', error);
    ResponseService.serverError(res, 'Failed to update shop');
  }
};

// Delete a shop - Optimized with service layer
export const deleteShop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteById(Shop, id, res, 'shop');
  } catch (error) {
    console.error('Error in deleteShop:', error);
    ResponseService.serverError(res, 'Failed to delete shop');
  }
};

// Update shop status - Optimized with service layer
export const updateShopStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      ResponseService.validationError(res, 'Status must be active, inactive, or suspended');
      return;
    }

    const shop = await DatabaseService.updateById<ShopDocument>(
      Shop,
      id,
      { status },
      res,
      'shop',
      {
        populate: { path: 'owner', select: 'fullName username firstName lastName' }
      }
    );

    if (shop) {
      const shopResponse = transformShopData(shop);
      
      // Notify dashboard update
      if (socketHandler) {
        await socketHandler.notifyShopUpdate();
      }

      ResponseService.updated(res, shopResponse);
    }
  } catch (error) {
    console.error('Error in updateShopStatus:', error);
    ResponseService.serverError(res, 'Failed to update shop status');
  }
}; 