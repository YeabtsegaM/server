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
exports.WinPattern = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WinPatternSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    pattern: {
        type: [[Boolean]],
        required: true,
        validate: {
            validator: function (pattern) {
                return pattern.length === 5 && pattern.every(row => row.length === 5);
            },
            message: 'Pattern must be a 5x5 grid'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    cashierId: {
        type: String,
        required: true,
        index: true
    },
    shopId: {
        type: String,
        required: false,
        index: true
    }
}, {
    timestamps: true
});
// Index for efficient queries
WinPatternSchema.index({ cashierId: 1, isActive: 1 });
WinPatternSchema.index({ shopId: 1, isActive: 1 });
// Ensure unique pattern names per cashier
WinPatternSchema.index({ cashierId: 1, name: 1 }, { unique: true });
exports.WinPattern = mongoose_1.default.model('WinPattern', WinPatternSchema);
//# sourceMappingURL=WinPattern.js.map