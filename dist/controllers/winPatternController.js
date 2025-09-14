"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveWinPatterns = exports.toggleWinPatternStatus = exports.deleteWinPattern = exports.updateWinPattern = exports.createWinPattern = exports.getWinPattern = exports.getWinPatterns = void 0;
const WinPattern_1 = require("../models/WinPattern");
const responseService_1 = require("../services/responseService");
// Get all win patterns for a cashier
const getWinPatterns = async (req, res) => {
    try {
        const { cashierId, shopId } = req.query;
        if (!cashierId) {
            return responseService_1.ResponseService.badRequest(res, 'Cashier ID is required');
        }
        const query = { cashierId: cashierId };
        // If shopId is provided, include it in the query
        if (shopId) {
            query.shopId = shopId;
        }
        const patterns = await WinPattern_1.WinPattern.find(query).sort({ createdAt: -1 });
        // Transform _id to id for frontend compatibility
        const transformedPatterns = patterns.map(pattern => {
            const patternObj = pattern.toObject();
            return {
                ...patternObj,
                id: patternObj._id,
                _id: undefined
            };
        });
        responseService_1.ResponseService.success(res, transformedPatterns, 'Win patterns retrieved successfully');
    }
    catch (error) {
        console.error('Error getting win patterns:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getWinPatterns = getWinPatterns;
// Get a single win pattern by ID
const getWinPattern = async (req, res) => {
    try {
        const { id } = req.params;
        const pattern = await WinPattern_1.WinPattern.findById(id);
        if (!pattern) {
            return responseService_1.ResponseService.notFound(res, 'Win pattern');
        }
        // Transform _id to id for frontend compatibility
        const patternObj = pattern.toObject();
        const transformedPattern = {
            ...patternObj,
            id: patternObj._id,
            _id: undefined
        };
        responseService_1.ResponseService.success(res, transformedPattern, 'Win pattern retrieved successfully');
    }
    catch (error) {
        console.error('Error getting win pattern:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getWinPattern = getWinPattern;
// Create a new win pattern
const createWinPattern = async (req, res) => {
    try {
        const { name, pattern, isActive, cashierId, shopId } = req.body;
        // Validate required fields
        if (!name || !pattern || !cashierId) {
            return responseService_1.ResponseService.badRequest(res, 'Name, pattern, and cashierId are required');
        }
        // Validate pattern structure
        if (!Array.isArray(pattern) || pattern.length !== 5 ||
            !pattern.every(row => Array.isArray(row) && row.length === 5)) {
            return responseService_1.ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
        }
        // Check if pattern name already exists for this cashier
        const existingPatternByName = await WinPattern_1.WinPattern.findOne({
            cashierId,
            name: name.trim()
        });
        if (existingPatternByName) {
            return responseService_1.ResponseService.error(res, 'Pattern name already exists', 409);
        }
        // Check if pattern design already exists for this cashier
        const existingPatternByDesign = await WinPattern_1.WinPattern.findOne({
            cashierId,
            pattern: pattern
        });
        if (existingPatternByDesign) {
            return responseService_1.ResponseService.error(res, 'Pattern design already exists', 409);
        }
        const newPattern = new WinPattern_1.WinPattern({
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
        responseService_1.ResponseService.created(res, transformedPattern, 'Win pattern created successfully');
    }
    catch (error) {
        console.error('Error creating win pattern:', error);
        if (error.code === 11000) {
            return responseService_1.ResponseService.error(res, 'A pattern with this name already exists for this cashier', 409);
        }
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.createWinPattern = createWinPattern;
// Update a win pattern
const updateWinPattern = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, pattern, isActive } = req.body;
        const existingPattern = await WinPattern_1.WinPattern.findById(id);
        if (!existingPattern) {
            return responseService_1.ResponseService.notFound(res, 'Win pattern');
        }
        // If name is being updated, check for duplicate names
        if (name && name !== existingPattern.name) {
            const duplicatePatternByName = await WinPattern_1.WinPattern.findOne({
                cashierId: existingPattern.cashierId,
                name: name.trim(),
                _id: { $ne: id }
            });
            if (duplicatePatternByName) {
                return responseService_1.ResponseService.error(res, 'Pattern name already exists', 409);
            }
        }
        // If pattern is being updated, check for duplicate designs
        if (pattern && JSON.stringify(pattern) !== JSON.stringify(existingPattern.pattern)) {
            const duplicatePatternByDesign = await WinPattern_1.WinPattern.findOne({
                cashierId: existingPattern.cashierId,
                pattern: pattern,
                _id: { $ne: id }
            });
            if (duplicatePatternByDesign) {
                return responseService_1.ResponseService.error(res, 'Pattern design already exists', 409);
            }
        }
        // Validate pattern structure if provided
        if (pattern && (!Array.isArray(pattern) || pattern.length !== 5 ||
            !pattern.every(row => Array.isArray(row) && row.length === 5))) {
            return responseService_1.ResponseService.badRequest(res, 'Pattern must be a 5x5 grid');
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name.trim();
        if (pattern !== undefined)
            updateData.pattern = pattern;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const updatedPattern = await WinPattern_1.WinPattern.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedPattern) {
            return responseService_1.ResponseService.notFound(res, 'Win pattern');
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
        responseService_1.ResponseService.updated(res, transformedPattern, 'Win pattern updated successfully');
    }
    catch (error) {
        console.error('Error updating win pattern:', error);
        if (error.code === 11000) {
            return responseService_1.ResponseService.error(res, 'A pattern with this name already exists for this cashier', 409);
        }
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.updateWinPattern = updateWinPattern;
// Delete a win pattern
const deleteWinPattern = async (req, res) => {
    try {
        const { id } = req.params;
        const pattern = await WinPattern_1.WinPattern.findById(id);
        if (!pattern) {
            return responseService_1.ResponseService.notFound(res, 'Win pattern');
        }
        await WinPattern_1.WinPattern.findByIdAndDelete(id);
        // Emit real-time update
        req.app.locals.io?.emit('win-pattern:deleted', {
            patternId: id,
            cashierId: pattern.cashierId
        });
        responseService_1.ResponseService.deleted(res, 'Win pattern deleted successfully');
    }
    catch (error) {
        console.error('Error deleting win pattern:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.deleteWinPattern = deleteWinPattern;
// Toggle pattern active status
const toggleWinPatternStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const pattern = await WinPattern_1.WinPattern.findById(id);
        if (!pattern) {
            return responseService_1.ResponseService.notFound(res, 'Win pattern');
        }
        const updatedPattern = await WinPattern_1.WinPattern.findByIdAndUpdate(id, { isActive }, { new: true });
        if (!updatedPattern) {
            return responseService_1.ResponseService.notFound(res, 'Win pattern');
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
        responseService_1.ResponseService.updated(res, transformedPattern, 'Win pattern status updated successfully');
    }
    catch (error) {
        console.error('Error toggling win pattern status:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.toggleWinPatternStatus = toggleWinPatternStatus;
// Get active win patterns for a cashier (for game use)
const getActiveWinPatterns = async (req, res) => {
    try {
        const { cashierId, shopId } = req.query;
        if (!cashierId) {
            return responseService_1.ResponseService.badRequest(res, 'Cashier ID is required');
        }
        const query = {
            cashierId: cashierId,
            isActive: true
        };
        if (shopId) {
            query.shopId = shopId;
        }
        const patterns = await WinPattern_1.WinPattern.find(query).select('name pattern').sort({ name: 1 });
        // Transform _id to id for frontend compatibility
        const transformedPatterns = patterns.map(pattern => {
            const patternObj = pattern.toObject();
            return {
                ...patternObj,
                id: patternObj._id,
                _id: undefined
            };
        });
        responseService_1.ResponseService.success(res, transformedPatterns, 'Active win patterns retrieved successfully');
    }
    catch (error) {
        console.error('Error getting active win patterns:', error);
        responseService_1.ResponseService.serverError(res, 'Internal server error');
    }
};
exports.getActiveWinPatterns = getActiveWinPatterns;
//# sourceMappingURL=winPatternController.js.map