"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const slipController_1 = require("../controllers/slipController");
const router = express_1.default.Router();
// POST /api/slips/search - Admin search for slip details
router.post('/search', slipController_1.searchSlips);
exports.default = router;
//# sourceMappingURL=slips.js.map