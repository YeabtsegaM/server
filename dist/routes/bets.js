"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const betController_1 = require("../controllers/betController");
const cashierAuth_1 = require("../middleware/cashierAuth");
const router = express_1.default.Router();
// Apply authentication middleware to all bet routes
router.use(cashierAuth_1.authenticateCashier);
// Place a new bet
router.post('/place', betController_1.placeBet);
// Get recent bets for current game
router.get('/recent', betController_1.getRecentBets);
// Get all historical bets for recall functionality
router.get('/recall', betController_1.getRecallBets);
// Get bet by ticket number
router.get('/ticket/:ticketNumber', betController_1.getBetByTicketNumber);
// Print recall ticket
router.post('/print-recall/:ticketNumber', betController_1.printRecallTicket);
// Get placed bet cartelas for current game
router.get('/placed-cartelas', betController_1.getPlacedBetCartelas);
// Search ticket by number for cancellation
router.get('/search/:ticketNumber', betController_1.searchTicketByNumber);
// Cancel a ticket
router.post('/cancel/:ticketNumber', betController_1.cancelTicket);
// Redeem a ticket (only for completed games)
router.post('/redeem/:ticketNumber', betController_1.redeemTicket);
exports.default = router;
//# sourceMappingURL=bets.js.map