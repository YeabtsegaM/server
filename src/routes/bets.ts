import express from 'express';
import { placeBet, getRecentBets, getRecallBets, getBetByTicketNumber, printRecallTicket, getPlacedBetCartelas, searchTicketByNumber, cancelTicket, redeemTicket } from '../controllers/betController';
import { authenticateCashier } from '../middleware/cashierAuth';

const router = express.Router();

// Apply authentication middleware to all bet routes
router.use(authenticateCashier);

// Place a new bet
router.post('/place', placeBet);

// Get recent bets for current game
router.get('/recent', getRecentBets);

// Get all historical bets for recall functionality
router.get('/recall', getRecallBets);

// Get bet by ticket number
router.get('/ticket/:ticketNumber', getBetByTicketNumber);

// Print recall ticket
router.post('/print-recall/:ticketNumber', printRecallTicket);

// Get placed bet cartelas for current game
router.get('/placed-cartelas', getPlacedBetCartelas);

// Search ticket by number for cancellation
router.get('/search/:ticketNumber', searchTicketByNumber);

// Cancel a ticket
router.post('/cancel/:ticketNumber', cancelTicket);

// Redeem a ticket (only for completed games)
router.post('/redeem/:ticketNumber', redeemTicket);

export default router;
