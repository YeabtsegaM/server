"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleShopOwnerStatus = exports.deleteShopOwner = exports.updateShopOwner = exports.createShopOwner = exports.getShopOwners = exports.setSocketHandler = void 0;
const ShopOwner_1 = __importDefault(require("../models/ShopOwner"));
const responseService_1 = require("../services/responseService");
const databaseService_1 = require("../services/databaseService");
// Global variable to store socket handler reference
let socketHandler = null;
// Function to set socket handler reference
const setSocketHandler = (io) => {
    socketHandler = {
        notifyShopOwnerUpdate: async () => {
            try {
                // Emit shop owner update event to admin clients
                io.to('admin').emit('shopOwner:updated', {
                    message: 'Shop owner data updated',
                    timestamp: new Date().toISOString()
                });
                console.log('📡 Shop owner update notification sent to admin clients');
            }
            catch (error) {
                console.error('Error sending shop owner update notification:', error);
            }
        }
    };
};
exports.setSocketHandler = setSocketHandler;
// Transform shop owner data for consistent response format
const transformShopOwnerData = (shopOwner) => ({
    _id: shopOwner._id,
    firstName: shopOwner.firstName,
    lastName: shopOwner.lastName,
    fullName: `${shopOwner.firstName} ${shopOwner.lastName}`,
    username: shopOwner.username,
    isActive: shopOwner.isActive,
    createdAt: shopOwner.createdAt
});
// Get all shop owners - Optimized with service layer
const getShopOwners = async (req, res) => {
    try {
        const shopOwners = await databaseService_1.DatabaseService.findAll(ShopOwner_1.default, res, 'shop owners', {
            select: '-password',
            sort: { createdAt: -1 }
        });
        // Always return an array, even if shopOwners is null
        const shopOwnersArray = shopOwners || [];
        const transformedShopOwners = shopOwnersArray.map(transformShopOwnerData);
        responseService_1.ResponseService.success(res, transformedShopOwners);
    }
    catch (error) {
        console.error('Error in getShopOwners:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to fetch shop owners');
    }
};
exports.getShopOwners = getShopOwners;
// Create new shop owner - Optimized with service layer
const createShopOwner = async (req, res) => {
    try {
        const { firstName, lastName, username, password } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !username || !password) {
            responseService_1.ResponseService.validationError(res, 'First name, last name, username, and password are required');
            return;
        }
        // Check if username already exists
        const exists = await databaseService_1.DatabaseService.exists(ShopOwner_1.default, { username }, res, 'shop owner', 'Username already exists');
        if (exists)
            return;
        // Hash password
        const hashedPassword = await databaseService_1.DatabaseService.hashPassword(password, 10);
        // Create shop owner
        const shopOwner = await databaseService_1.DatabaseService.create(ShopOwner_1.default, {
            firstName,
            lastName,
            username,
            password: hashedPassword,
            isActive: true
        }, res, 'shop owner', transformShopOwnerData);
        if (shopOwner) {
            // Notify dashboard update
            if (socketHandler) {
                await socketHandler.notifyShopOwnerUpdate();
            }
        }
    }
    catch (error) {
        console.error('Error in createShopOwner:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to create shop owner');
    }
};
exports.createShopOwner = createShopOwner;
// Update shop owner - Optimized with service layer
const updateShopOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, username, password } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !username) {
            responseService_1.ResponseService.validationError(res, 'First name, last name, and username are required');
            return;
        }
        // Check if username is taken by another shop owner
        const existingShopOwner = await databaseService_1.DatabaseService.findById(ShopOwner_1.default, id, res, 'shop owner');
        if (!existingShopOwner)
            return;
        // Check if username is taken by another shop owner
        const usernameExists = await databaseService_1.DatabaseService.exists(ShopOwner_1.default, { username, _id: { $ne: id } }, res, 'shop owner', 'Username already exists');
        if (usernameExists)
            return;
        const updateData = { firstName, lastName, username };
        // Hash password if provided
        if (password) {
            updateData.password = await databaseService_1.DatabaseService.hashPassword(password, 10);
        }
        const shopOwner = await databaseService_1.DatabaseService.updateById(ShopOwner_1.default, id, updateData, res, 'shop owner', {
            select: '-password'
        });
        if (shopOwner) {
            const shopOwnerResponse = transformShopOwnerData(shopOwner);
            // Notify dashboard update
            if (socketHandler) {
                await socketHandler.notifyShopOwnerUpdate();
            }
            responseService_1.ResponseService.updated(res, shopOwnerResponse);
        }
    }
    catch (error) {
        console.error('Error in updateShopOwner:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to update shop owner');
    }
};
exports.updateShopOwner = updateShopOwner;
// Delete shop owner - Optimized with service layer
const deleteShopOwner = async (req, res) => {
    try {
        const { id } = req.params;
        await databaseService_1.DatabaseService.deleteById(ShopOwner_1.default, id, res, 'shop owner');
    }
    catch (error) {
        console.error('Error in deleteShopOwner:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to delete shop owner');
    }
};
exports.deleteShopOwner = deleteShopOwner;
// Toggle shop owner status - Optimized with service layer
const toggleShopOwnerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const shopOwner = await databaseService_1.DatabaseService.updateById(ShopOwner_1.default, id, [{ $set: { isActive: { $not: '$isActive' } } }], res, 'shop owner', {
            select: '-password'
        });
        if (shopOwner) {
            const shopOwnerResponse = transformShopOwnerData(shopOwner);
            // Notify dashboard update
            if (socketHandler) {
                await socketHandler.notifyShopOwnerUpdate();
            }
            responseService_1.ResponseService.updated(res, shopOwnerResponse);
        }
    }
    catch (error) {
        console.error('Error in toggleShopOwnerStatus:', error);
        responseService_1.ResponseService.serverError(res, 'Failed to toggle shop owner status');
    }
};
exports.toggleShopOwnerStatus = toggleShopOwnerStatus;
//# sourceMappingURL=shopOwnerController.js.map