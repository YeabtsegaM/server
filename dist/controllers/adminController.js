"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
/**
 * Admin Controller - Handles admin operations including betting configuration
 */
class AdminController {
    /**
     * Update shop-specific betting configuration (Shop Margin, System Fee)
     */
    static async updateShopBettingConfig(req, res) {
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
            const Shop = (await Promise.resolve().then(() => __importStar(require('../models/Shop')))).default;
            // Update shop configuration
            const updatedShop = await Shop.findByIdAndUpdate(shopId, {
                $set: {
                    margin: shopMargin,
                    systemRevenuePercentage: systemFee
                }
            }, { new: true });
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
        }
        catch (error) {
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
    static async getShopBettingConfig(req, res) {
        try {
            const { shopId } = req.params;
            // Import Shop model dynamically
            const Shop = (await Promise.resolve().then(() => __importStar(require('../models/Shop')))).default;
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
        }
        catch (error) {
            console.error('Error getting shop betting configuration:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get shop betting configuration',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map