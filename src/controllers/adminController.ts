import { Request, Response } from 'express';
import { updateGlobalConfig, getGlobalConfig } from '../utils/sessionUtils';

/**
 * Admin Controller - Handles admin operations including betting configuration
 */
export class AdminController {
  
  /**
   * Update shop-specific betting configuration (Shop Margin, System Fee)
   */
  static async updateShopBettingConfig(req: Request, res: Response) {
    try {
      const { shopId } = req.params;
      const { shopMargin, systemFee } = req.body;
      
      // Validate input
      if (shopMargin !== undefined && (shopMargin < 10 || shopMargin > 45)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Shop margin must be between 10 and 45%' 
        });
      }
      
      if (systemFee !== undefined && (systemFee < 5 || systemFee > 20)) {
        return res.status(400).json({ 
          success: false, 
          message: 'System fee must be between 5 and 20%' 
        });
      }
      
      // Import Shop model dynamically
      const Shop = (await import('../models/Shop')).default;
      
      // Update shop configuration
      const updatedShop = await Shop.findByIdAndUpdate(
        shopId,
        {
          $set: {
            margin: shopMargin,
            systemRevenuePercentage: systemFee
          }
        },
        { new: true }
      );
      
      if (!updatedShop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }
    
      
      res.json({
        success: true,
        message: 'Shop betting configuration updated successfully',
        data: { 
          shopId: updatedShop._id,
          shopName: updatedShop.shopName,
          shopMargin: updatedShop.margin
        }
      });
      
    } catch (error) {
      console.error('Error updating shop betting configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update shop betting configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
    /**
   * Get shop-specific betting configuration
   */
  static async getShopBettingConfig(req: Request, res: Response) {
    try {
      const { shopId } = req.params;
      
      // Import Shop model dynamically
      const Shop = (await import('../models/Shop')).default;
      
      const shop = await Shop.findById(shopId);
      
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          shopId: shop._id,
          shopName: shop.shopName,
          shopMargin: shop.margin
        }
      });
      
    } catch (error) {
      console.error('Error getting shop betting configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get shop betting configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
