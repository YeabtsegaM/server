"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalConfig = exports.updateGlobalConfig = exports.initializeGlobalConfig = exports.generateBatCommand = exports.generateDisplayUrl = exports.generateSessionId = void 0;
const uuid_1 = require("uuid");
const GlobalConfig_1 = __importDefault(require("../models/GlobalConfig"));
/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
    return (0, uuid_1.v4)();
};
exports.generateSessionId = generateSessionId;
/**
 * Generate display URL with session ID
 */
const generateDisplayUrl = (sessionId, baseUrl) => {
    const defaultBaseUrl = 'http://localhost:3001?Bingo=';
    return `${baseUrl || defaultBaseUrl}${sessionId}`;
};
exports.generateDisplayUrl = generateDisplayUrl;
/**
 * Generate BAT command for a cashier (on demand)
 */
const generateBatCommand = async (sessionId) => {
    try {
        // Get global configuration
        const globalConfig = await GlobalConfig_1.default.findOne({ id: 'global-config' });
        if (!globalConfig) {
            // Use default template if no global config exists
            const defaultTemplate = 'start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen';
            const displayUrl = (0, exports.generateDisplayUrl)(sessionId);
            return `${defaultTemplate} "${displayUrl}"`;
        }
        const displayUrl = (0, exports.generateDisplayUrl)(sessionId, globalConfig.displayBaseUrl);
        return `${globalConfig.batTemplate} "${displayUrl}"`;
    }
    catch (error) {
        console.error('Error generating BAT command:', error);
        // Fallback to default
        const displayUrl = (0, exports.generateDisplayUrl)(sessionId);
        return `start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen "${displayUrl}"`;
    }
};
exports.generateBatCommand = generateBatCommand;
/**
 * Initialize or update global configuration
 */
const initializeGlobalConfig = async () => {
    try {
        const existingConfig = await GlobalConfig_1.default.findOne({ id: 'global-config' });
        if (!existingConfig) {
            await GlobalConfig_1.default.create({
                id: 'global-config',
                batTemplate: 'start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen',
                displayBaseUrl: 'http://localhost:3001?Bingo='
            });
            console.log('✅ Global configuration initialized');
        }
    }
    catch (error) {
        console.error('Error initializing global config:', error);
    }
};
exports.initializeGlobalConfig = initializeGlobalConfig;
/**
 * Update global configuration
 */
const updateGlobalConfig = async (updates) => {
    try {
        await GlobalConfig_1.default.findOneAndUpdate({ id: 'global-config' }, { $set: updates }, { upsert: true, new: true });
        console.log('✅ Global configuration updated');
    }
    catch (error) {
        console.error('Error updating global config:', error);
        throw error;
    }
};
exports.updateGlobalConfig = updateGlobalConfig;
/**
 * Get global configuration
 */
const getGlobalConfig = async () => {
    try {
        const config = await GlobalConfig_1.default.findOne({ id: 'global-config' });
        return config;
    }
    catch (error) {
        console.error('Error getting global config:', error);
        return null;
    }
};
exports.getGlobalConfig = getGlobalConfig;
//# sourceMappingURL=sessionUtils.js.map