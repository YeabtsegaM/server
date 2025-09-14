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
exports.getCartelaByCartelaId = exports.getActiveCartelas = exports.toggleCartelaStatus = exports.deleteCartela = exports.updateCartela = exports.createCartela = exports.getCartela = exports.getCartelasForDisplay = exports.getCartelas = void 0;
const Cartela_1 = require("../models/Cartela");
const responseService_1 = require("../services/responseService");
// Get all cartelas for a cashier or all cartelas if no cashierId provided
const getCartelas = async (req, res) => {
    try {
        const { cashierId, shopId } = req.query;
        let query = {};
        // If cashierId is provided, filter by cashier
        if (cashierId) {
            query.cashierId = cashierId;
        }
        // If shopId is provided, include it in the query
        if (shopId) {
            query.shopId = shopId;
        }
        const cartelas = await Cartela_1.Cartela.find(query).sort({ cartelaId: 1 });
        // Transform _id to id for frontend compatibility
        const transformedCartelas = cartelas.map(cartela => {
            const cartelaObj = cartela.toObject();
            return {
                ...cartelaObj,
                id: cartelaObj._id,
                _id: undefined
            };
        });
        responseService_1.ResponseService.success(res, transformedCartelas, 'Cartelas retrieved successfully');
    }
    catch (error) {
        console.error('Error getting cartelas:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getCartelas = getCartelas;
// Get cartelas for display (public access, no authentication required)
const getCartelasForDisplay = async (req, res) => {
    try {
        // For display, we need to get cartelas from the specific game session
        // The sessionId should be the displayToken from the Game model
        const { sessionId } = req.query;
        console.log('🔍 Display cartelas request - sessionId:', sessionId);
        console.log('🔍 Request query:', req.query);
        if (!sessionId) {
            console.log('❌ No sessionId provided');
            return responseService_1.ResponseService.badRequest(res, 'Session ID is required for display');
        }
        // First, find the game associated with this displayToken
        const Game = (await Promise.resolve().then(() => __importStar(require('../models/Game')))).default;
        console.log('🔍 Searching for game with displayToken:', sessionId);
        const game = await Game.findOne({
            displayToken: sessionId,
            status: 'waiting'
        }).sort({ lastActivity: -1 });
        if (!game) {
            console.log('❌ No waiting game found for displayToken:', sessionId);
            return responseService_1.ResponseService.badRequest(res, 'No waiting game found for this display token');
        }
        if (!game.cashierId) {
            console.log('❌ Game found but no cashier assigned yet');
            return responseService_1.ResponseService.badRequest(res, 'Game session found but no cashier assigned yet');
        }
        // Get cartelas for the cashier from the game
        console.log('🔍 Fetching cartelas for cashierId:', game.cashierId);
        const cartelas = await Cartela_1.Cartela.find({
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
        responseService_1.ResponseService.success(res, transformedCartelas, 'Cartelas retrieved successfully for display');
    }
    catch (error) {
        console.error('❌ Error getting cartelas for display:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getCartelasForDisplay = getCartelasForDisplay;
// Get a single cartela by ID
const getCartela = async (req, res) => {
    try {
        const { id } = req.params;
        const cartela = await Cartela_1.Cartela.findById(id);
        if (!cartela) {
            return responseService_1.ResponseService.notFound(res, 'Cartela');
        }
        // Transform _id to id for frontend compatibility
        const cartelaObj = cartela.toObject();
        const transformedCartela = {
            ...cartelaObj,
            id: cartelaObj._id,
            _id: undefined
        };
        responseService_1.ResponseService.success(res, transformedCartela, 'Cartela retrieved successfully');
    }
    catch (error) {
        console.error('Error getting cartela:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getCartela = getCartela;
// Create a new cartela
const createCartela = async (req, res) => {
    try {
        const { cartelaId, pattern, isActive, cashierId, shopId } = req.body;
        // Validate required fields
        if (!cartelaId || !pattern || !cashierId) {
            return responseService_1.ResponseService.badRequest(res, 'Cartela ID, pattern, and cashierId are required');
        }
        // Validate cartelaId range
        if (cartelaId < 1 || cartelaId > 210) {
            return responseService_1.ResponseService.badRequest(res, 'Cartela ID must be between 1 and 210');
        }
        // Validate pattern structure
        if (!Array.isArray(pattern) || pattern.length !== 5 ||
            !pattern.every(row => Array.isArray(row) && row.length === 5)) {
            return responseService_1.ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
        }
        // Check if cartelaId already exists for this cashier
        const existingCartela = await Cartela_1.Cartela.findOne({
            cashierId,
            cartelaId: cartelaId
        });
        if (existingCartela) {
            return responseService_1.ResponseService.error(res, 'Cartela ID already exists', 409);
        }
        // Check if cashier has reached the limit of 210 cartelas
        const cartelaCount = await Cartela_1.Cartela.countDocuments({ cashierId });
        if (cartelaCount >= 210) {
            return responseService_1.ResponseService.error(res, 'Maximum limit of 210 cartelas reached', 409);
        }
        const newCartela = new Cartela_1.Cartela({
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
        responseService_1.ResponseService.created(res, transformedCartela, 'Cartela created successfully');
    }
    catch (error) {
        console.error('Error creating cartela:', error);
        if (error.code === 11000) {
            return responseService_1.ResponseService.error(res, 'Cartela ID already exists', 409);
        }
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.createCartela = createCartela;
// Update a cartela
const updateCartela = async (req, res) => {
    try {
        const { id } = req.params;
        const { cartelaId, pattern, isActive } = req.body;
        const existingCartela = await Cartela_1.Cartela.findById(id);
        if (!existingCartela) {
            return responseService_1.ResponseService.notFound(res, 'Cartela');
        }
        // If cartelaId is being updated, check for duplicates
        if (cartelaId && cartelaId !== existingCartela.cartelaId) {
            const duplicateCartela = await Cartela_1.Cartela.findOne({
                cashierId: existingCartela.cashierId,
                cartelaId: cartelaId,
                _id: { $ne: id }
            });
            if (duplicateCartela) {
                return responseService_1.ResponseService.error(res, 'Cartela ID already exists', 409);
            }
        }
        // Validate cartelaId range if provided
        if (cartelaId && (cartelaId < 1 || cartelaId > 210)) {
            return responseService_1.ResponseService.badRequest(res, 'Cartela ID must be between 1 and 210');
        }
        // Validate pattern structure if provided
        if (pattern && (!Array.isArray(pattern) || pattern.length !== 5 ||
            !pattern.every(row => Array.isArray(row) && row.length === 5))) {
            return responseService_1.ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
        }
        const updateData = {};
        if (cartelaId !== undefined)
            updateData.cartelaId = cartelaId;
        if (pattern !== undefined)
            updateData.pattern = pattern;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const updatedCartela = await Cartela_1.Cartela.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedCartela) {
            return responseService_1.ResponseService.notFound(res, 'Cartela');
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
        responseService_1.ResponseService.success(res, transformedCartela, 'Cartela updated successfully');
    }
    catch (error) {
        console.error('Error updating cartela:', error);
        if (error.code === 11000) {
            return responseService_1.ResponseService.error(res, 'Cartela ID already exists', 409);
        }
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.updateCartela = updateCartela;
// Delete a cartela
const deleteCartela = async (req, res) => {
    try {
        const { id } = req.params;
        const cartela = await Cartela_1.Cartela.findById(id);
        if (!cartela) {
            return responseService_1.ResponseService.notFound(res, 'Cartela');
        }
        await Cartela_1.Cartela.findByIdAndDelete(id);
        // Emit real-time update
        req.app.locals.io?.emit('cartela:deleted', {
            cartelaId: id,
            cashierId: cartela.cashierId
        });
        responseService_1.ResponseService.success(res, null, 'Cartela deleted successfully');
    }
    catch (error) {
        console.error('Error deleting cartela:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.deleteCartela = deleteCartela;
// Toggle cartela active status
const toggleCartelaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const cartela = await Cartela_1.Cartela.findById(id);
        if (!cartela) {
            return responseService_1.ResponseService.notFound(res, 'Cartela');
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
        responseService_1.ResponseService.success(res, transformedCartela, 'Cartela status updated successfully');
    }
    catch (error) {
        console.error('Error toggling cartela status:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.toggleCartelaStatus = toggleCartelaStatus;
// Get active cartelas for a cashier
const getActiveCartelas = async (req, res) => {
    try {
        const { cashierId, shopId } = req.query;
        if (!cashierId) {
            return responseService_1.ResponseService.badRequest(res, 'Cashier ID is required');
        }
        const query = {
            cashierId: cashierId,
            isActive: true
        };
        // If shopId is provided, include it in the query
        if (shopId) {
            query.shopId = shopId;
        }
        const cartelas = await Cartela_1.Cartela.find(query).sort({ cartelaId: 1 });
        // Transform _id to id for frontend compatibility
        const transformedCartelas = cartelas.map(cartela => {
            const cartelaObj = cartela.toObject();
            return {
                ...cartelaObj,
                id: cartelaObj._id,
                _id: undefined
            };
        });
        responseService_1.ResponseService.success(res, transformedCartelas, 'Active cartelas retrieved successfully');
    }
    catch (error) {
        console.error('Error getting active cartelas:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getActiveCartelas = getActiveCartelas;
// Get a single cartela by cartelaId number (for printing)
const getCartelaByCartelaId = async (req, res) => {
    try {
        const { cartelaId, cashierId } = req.params;
        if (!cartelaId || !cashierId) {
            return responseService_1.ResponseService.badRequest(res, 'Cartela ID and Cashier ID are required');
        }
        const cartela = await Cartela_1.Cartela.findOne({
            cartelaId: parseInt(cartelaId),
            cashierId,
            isActive: true
        });
        if (!cartela) {
            return responseService_1.ResponseService.notFound(res, 'Cartela not found or inactive');
        }
        // Transform _id to id for frontend compatibility
        const cartelaObj = cartela.toObject();
        const transformedCartela = {
            ...cartelaObj,
            id: cartelaObj._id,
            _id: undefined
        };
        responseService_1.ResponseService.success(res, transformedCartela, 'Cartela retrieved successfully');
    }
    catch (error) {
        console.error('Error getting cartela by cartelaId:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getCartelaByCartelaId = getCartelaByCartelaId;
//# sourceMappingURL=cartelaController.js.map