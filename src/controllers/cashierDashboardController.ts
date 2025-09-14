import { Request, Response } from 'express';
import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';
import Cashier from '../models/Cashier';
import Shop from '../models/Shop';
import mongoose from 'mongoose'; // Add mongoose import for ObjectId conversion

interface CashierRequest extends Request {
  cashier?: {
    id: string;
    username: string;
    role: string;
    shopId: string;
  };
}

export const getDashboardStats = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // Get cashier's shop
    const cashier = await Cashier.findById(cashierId).populate('shop');
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    // TODO: Implement real dashboard stats calculation
    // For now, return empty stats until real data is available
    const stats = {
      totalCartelas: 0,
      totalRevenue: 0,
      activeGames: 0,
      completedGames: 0
    };

    ResponseService.success(res, stats);

  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    ResponseService.serverError(res, 'Failed to fetch dashboard stats');
  }
};

export const getRecentActivity = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // TODO: Implement real activity logging
    // For now, return empty activities until real logging is implemented
    const activities: any[] = [];

    ResponseService.success(res, activities);

  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    ResponseService.serverError(res, 'Failed to fetch recent activity');
  }
};

export const getCashierSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const cashierId = (req as any).cashier.id;
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      ResponseService.validationError(res, 'From date and to date are required');
      return;
    }

    // Convert string cashierId to ObjectId for proper database queries
    const cashierObjectId = new mongoose.Types.ObjectId(cashierId);

    // Get cashier details
    const cashier = await Cashier.findById(cashierId).populate<{ shop: { shopName: string } }>('shop', 'shopName');
    
    if (!cashier) {
      ResponseService.notFound(res, 'Cashier not found');
      return;
    }

    // Import Bet model for real transaction data
    const Bet = (await import('../models/Bet')).default;

    // Build date filter for transactions - make it more flexible
    // Handle timezone properly: create local date boundaries that work with MongoDB UTC storage
    const fromDateStr = fromDate as string;
    const toDateStr = toDate as string;
    
    // Create start of day in local timezone
    const fromDateObj = new Date(fromDateStr + 'T00:00:00');
    // Create end of day in local timezone  
    const toDateObj = new Date(toDateStr + 'T23:59:59.999');
    
    const dateFilter = {
      placedAt: {
        $gte: fromDateObj,
        $lte: toDateObj
      }
    };

    // Calculate REAL financial data from transactions for this cashier
    const [
      tickets,
      bets,
      unclaimed,
      redeemed,
      netBalance,
      unclaimedCount,
      redeemCount
    ] = await Promise.all([
      // Total tickets created by this cashier in date range (excluding cancelled)
      Bet.countDocuments({
        cashierId: cashierObjectId, // Use ObjectId
        betStatus: { $ne: 'cancelled' }, // Exclude cancelled tickets
        ...dateFilter
      }),
      
      // Total bets placed by this cashier in date range (sum of all stakes)
      Bet.aggregate([
        {
          $match: {
            cashierId: cashierObjectId, // Use ObjectId
            betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$stake' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      
      // Total unclaimed (pending bets that haven't been settled + won/lost tickets that haven't been redeemed) in date range
      // Before game ends: include pending tickets, After game ends: include won/lost tickets
      Bet.aggregate([
        {
          $match: {
            cashierId: cashierObjectId, // Use ObjectId
            betStatus: { $in: ['pending', 'active', 'won', 'lost'] }, // Include pending (before game ends) and won/lost (after game ends)
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$stake' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      
      // Total redeemed (sum of win amounts) in date range
      Bet.aggregate([
        {
          $match: {
            cashierId: cashierObjectId, // Use ObjectId
            betStatus: { $in: ['won_redeemed', 'lost_redeemed'] },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$win' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      
      // Net balance (total bets - total redeemed) in date range
      Bet.aggregate([
        {
          $match: {
            cashierId: cashierObjectId, // Use ObjectId
            betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalBets: { $sum: '$stake' },
            totalRedeemed: { $sum: { $cond: [{ $in: ['$betStatus', ['won_redeemed', 'lost_redeemed']] }, '$win', 0] } }
          }
        }
      ]).then(result => {
        const totalBets = result[0]?.totalBets || 0;
        const totalRedeemed = result[0]?.totalRedeemed || 0;
        return totalBets - totalRedeemed;
      }),

      // NEW: Count unique games with unclaimed tickets (pending/won/lost)
      Bet.aggregate([
        {
          $match: {
            cashierId: cashierObjectId,
            betStatus: { $in: ['pending', 'active', 'won', 'lost'] },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$gameId'  // Group by gameId to count unique games
          }
        },
        {
          $count: 'totalGames'
        }
      ]).then(result => result[0]?.totalGames || 0),

      // NEW: Count unique games that have been redeemed (won_redeemed/lost_redeemed)
      Bet.aggregate([
        {
          $match: {
            cashierId: cashierObjectId,
            betStatus: { $in: ['won_redeemed', 'lost_redeemed'] },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$gameId'  // Group by gameId to count unique games
          }
        },
        {
          $count: 'totalGames'
        }
      ]).then(result => result[0]?.totalGames || 0)
    ]);

    const summaryData = {
      cashierName: cashier.username,
      fromDate: fromDate,
      toDate: toDate,
      tickets,
      bets,
      unclaimed,
      redeemed,
      netBalance: Math.round(netBalance * 100) / 100, // Round to 2 decimal places
      unclaimedCount,
      redeemCount,
      shopName: (cashier.shop as any)?.shopName || 'Unknown Shop'
    };

    ResponseService.success(res, summaryData);
  } catch (error) {
    console.error('Error in getCashierSummary:', error);
    ResponseService.serverError(res, 'Failed to fetch cashier summary');
  }
}; 