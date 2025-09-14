"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025';
const connectDatabase = async () => {
    try {
        // Suppress Mongoose index creation logs by overriding console.log
        const originalLog = console.log;
        console.log = (...args) => {
            const message = args[0];
            if (typeof message === 'string' && message.includes('Mongoose:') && message.includes('createIndex')) {
                return; // Suppress index creation logs
            }
            originalLog.apply(console, args);
        };
        // Performance optimizations
        await mongoose_1.default.connect(MONGODB_URI, {
            // Connection pool settings
            maxPoolSize: 10,
            minPoolSize: 2,
            // Server selection timeout
            serverSelectionTimeoutMS: 5000,
            // Socket timeout
            socketTimeoutMS: 45000,
            // Buffer commands
            bufferCommands: true,
            // Auto index
            autoIndex: process.env.NODE_ENV !== 'production',
            // Auto create
            autoCreate: process.env.NODE_ENV !== 'production'
        });
        // Set global options - disable debug mode to suppress index creation logs
        mongoose_1.default.set('debug', false);
        console.log('✅ Connected to MongoDB');
        // Restore original console.log
        console.log = originalLog;
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
    catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
//# sourceMappingURL=database.js.map