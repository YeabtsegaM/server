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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const cashierSchema = new mongoose_1.Schema({
    shop: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Shop',
        required: [true, 'Shop assignment is required']
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9._]+$/, 'Username can only contain letters, numbers, dots, and underscores']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['cashier'],
        default: 'cashier'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    // Session management fields
    sessionId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    displayUrl: {
        type: String,
        trim: true
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    lastActivity: {
        type: Date,
        default: null
    },
    // Game ID tracking - NEW 4-digit system (4000-4999)
    currentGameId: {
        type: Number,
        default: 4000,
        min: [4000, 'Game ID must be at least 4000'],
        max: [4999, 'Game ID cannot exceed 4999'],
        validate: {
            validator: function (value) {
                return value >= 4000 && value <= 4999;
            },
            message: 'Game ID must be a 4-digit number between 4000 and 4999'
        }
    },
    lastGameDate: {
        type: Date,
        default: null
    },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});
// Add compound index for game ID tracking to prevent duplication
cashierSchema.index({ currentGameId: 1, lastGameDate: 1 });
// Add index for session management
cashierSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cashierSchema.index({ username: 1 }, { unique: true });
// Hash password before saving
cashierSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Method to compare passwords
cashierSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.default = mongoose_1.default.model('Cashier', cashierSchema);
//# sourceMappingURL=Cashier.js.map