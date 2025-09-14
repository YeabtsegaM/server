import mongoose from 'mongoose';
/**
 * Bet Service - Handles all betting operations
 *
 * Features:
 * - Place new bets
 * - Verify bets
 * - Track bet status
 * - Calculate winnings
 * - Bet reporting
 */
export declare class BetService {
    /**
     * Get shop ID from cashier ID
     */
    private static getShopIdFromCashier;
    /**
     * Generate unique ticket number (13 digits)
     */
    private static generateTicketNumber;
    /**
     * Generate unique bet ID
     */
    private static generateBetId;
    /**
     * Place a new bet
     */
    static placeBet(betData: {
        gameId: string | number;
        cashierId: string;
        sessionId: string;
        cartelaId: number;
        stake: number;
        betType?: 'single' | 'multiple' | 'combination';
        selectedNumbers?: number[];
        notes?: string;
    }): Promise<mongoose.Document<unknown, {}, import("../models/Bet").IBet, {}> & import("../models/Bet").IBet & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Verify a bet (cashier verification)
     */
    static verifyBet(betId: string, cashierId: string): Promise<mongoose.Document<unknown, {}, import("../models/Bet").IBet, {}> & import("../models/Bet").IBet & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Get bet by ticket number
     */
    static getBetByTicketNumber(ticketNumber: string): Promise<(mongoose.Document<unknown, {}, import("../models/Bet").IBet, {}> & import("../models/Bet").IBet & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get all bets for a specific game
     */
    static getGameBets(gameId: string | number, sessionId: string): Promise<(mongoose.Document<unknown, {}, import("../models/Bet").IBet, {}> & import("../models/Bet").IBet & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get bet summary for a game
     */
    static getGameBetSummary(gameId: string | number, sessionId: string): Promise<{
        totalBets: number;
        totalStake: number;
        totalCartelas: number;
        verifiedBets: number;
        pendingBets: number;
        betsByType: {
            single: number;
            multiple: number;
            combination: number;
        };
    }>;
    /**
     * Settle bets when game ends
     */
    static settleGameBets(gameId: string | number, sessionId: string, finalNumbers: number[]): Promise<{
        totalBets: number;
        totalWinnings: number;
        settledBets: (mongoose.Document<unknown, {}, import("../models/Bet").IBet, {}> & import("../models/Bet").IBet & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
    /**
     * Calculate winnings for a bet
     */
    private static calculateWinnings;
    /**
     * Cancel a bet
     */
    static cancelBet(betId: string, cashierId: string, reason?: string): Promise<mongoose.Document<unknown, {}, import("../models/Bet").IBet, {}> & import("../models/Bet").IBet & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Get bet statistics for reporting
     */
    static getBetStatistics(startDate: Date, endDate: Date, cashierId?: string): Promise<{
        totalBets: any;
        totalStake: any;
        totalWinnings: any;
        averageStake: number;
        netProfit: number;
        betsByStatus: any;
        betsByType: any;
    }>;
}
//# sourceMappingURL=betService.d.ts.map