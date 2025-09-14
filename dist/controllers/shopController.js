"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShopStatus = exports.deleteShop = exports.updateShop = exports.createShop = exports.getShops = exports.setSocketHandler = void 0;
const Shop_1 = __importDefault(require("../models/Shop"));
const ShopOwner_1 = __importDefault(require("../models/ShopOwner"));
const responseService_1 = require("../services/responseService");
const databaseService_1 = require("../services/databaseService");
// Global variable to store socket handler reference
let socketHandler = null;
// Function to set socket handler reference
const setSocketHandler = (io) => {
    socketHandler = {
        notifyShopUpdate: async () => {
            try {
                // Emit shop update event to admin clients
                io.to('admin').emit('shop:updated', {
                    message: 'Shop data updated',
                    timestamp: new Date().toISOString()
                });
                console.log('📡 Shop update notification sent to admin clients');
            }
            catch (error) {
                console.error('Error sending shop update notification:', error);
            }
        }
    };
};
exports.setSocketHandler = setSocketHandler;
// Transform shop data for consistent response format
const transformShopData = (shop) => {
    const ownerData = shop.owner;
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
const getShops = async (req, res) => {
    try {
        const shops = await databaseService_1.DatabaseService.findAll(Shop_1.default, res, 'shops', {
            populate: { path: 'owner', select: 'fullName username firstName lastName' },
            sort: { createdAt: -1 }
        });
        // Always return an array, even if shops is null
        const shopsArray = shops || [];
        const transformedShops = shopsArray.map(transformShopData);
        responseService_1.ResponseService.success(res, transformedShops);
    }
    catch (error) {
        console.error('Error in getShops:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch shops');
    }
};
exports.getShops = getShops;
// Create a new shop - Optimized with service layer
const createShop = async (req, res) => {
    try {
        const { ownerId, shopName, location, margin = 10, status = 'active' } = req.body;
        // Validate required fields
        if (!ownerId || !shopName || !location) {
            responseService_1.ResponseService.validationError(res, 'Owner, shop name, and location are required');
            return;
        }
        // Convert and validate numeric values
        const marginValue = typeof margin === 'string' ? parseInt(margin, 10) : margin;
        // Validate ranges
        if (marginValue < 5 || marginValue > 50) {
            responseService_1.ResponseService.validationError(res, 'Margin must be between 5% and 50%');
            return;
        }
        // Check if owner exists
        if (ownerId) {
            const ownerExists = await ShopOwner_1.default.findById(ownerId);
            if (!ownerExists) {
                responseService_1.ResponseService.notFound(res, 'Owner not found');
                return;
            }
        }
        // Check if shop name already exists
        const exists = await databaseService_1.DatabaseService.exists(Shop_1.default, { shopName }, res, 'shop', 'Shop name already exists');
        if (exists)
            return;
        // Create shop with populated owner
        const shop = await databaseService_1.DatabaseService.create(Shop_1.default, {
            owner: ownerId,
            shopName,
            location,
            margin: marginValue,
            status: status
        }, res, 'shop', transformShopData);
        if (shop) {
            // Notify dashboard update
            if (socketHandler) {
                await socketHandler.notifyShopUpdate();
            }
        }
    }
    catch (error) {
        console.error('Error in createShop:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to create shop');
    }
};
exports.createShop = createShop;
// Update a shop - Optimized with service layer
const updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validate margin range if margin is being updated
        if (updateData.margin !== undefined) {
            const marginValue = typeof updateData.margin === 'string' ? parseInt(updateData.margin, 10) : updateData.margin;
            if (marginValue < 5 || marginValue > 50) {
                responseService_1.ResponseService.validationError(res, 'Margin must be between 5% and 50%');
                return;
            }
            updateData.margin = marginValue;
        }
        const shop = await databaseService_1.DatabaseService.updateById(Shop_1.default, id, updateData, res, 'shop', {
            populate: { path: 'owner', select: 'fullName username firstName lastName' }
        });
        if (shop) {
            const shopResponse = transformShopData(shop);
            // Notify dashboard update
            if (socketHandler) {
                await socketHandler.notifyShopUpdate();
            }
            responseService_1.ResponseService.updated(res, shopResponse);
        }
    }
    catch (error) {
        console.error('Error in updateShop:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to update shop');
    }
};
exports.updateShop = updateShop;
// Delete a shop - Optimized with service layer
const deleteShop = async (req, res) => {
    try {
        const { id } = req.params;
        await databaseService_1.DatabaseService.deleteById(Shop_1.default, id, res, 'shop');
    }
    catch (error) {
        console.error('Error in deleteShop:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to delete shop');
    }
};
exports.deleteShop = deleteShop;
// Update shop status - Optimized with service layer
const updateShopStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive', 'suspended'].includes(status)) {
            responseService_1.ResponseService.validationError(res, 'Status must be active, inactive, or suspended');
            return;
        }
        const shop = await databaseService_1.DatabaseService.updateById(Shop_1.default, id, { status }, res, 'shop', {
            populate: { path: 'owner', select: 'fullName username firstName lastName' }
        });
        if (shop) {
            const shopResponse = transformShopData(shop);
            // Notify dashboard update
            if (socketHandler) {
                await socketHandler.notifyShopUpdate();
            }
            responseService_1.ResponseService.updated(res, shopResponse);
        }
    }
    catch (error) {
        console.error('Error in updateShopStatus:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to update shop status');
    }
};
exports.updateShopStatus = updateShopStatus;
//# sourceMappingURL=shopController.js.map