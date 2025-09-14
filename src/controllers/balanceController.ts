import { Request, Response } from 'express';
import Shop from '../models/Shop';
import Cashier from '../models/Cashier';

import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';
import mongoose from 'mongoose';

// Type definitions
interface ShopDocument {
  _id: string;
  shopName: string;
  margin: number; // Add missing margin property
  systemRevenuePercentage: number;
  status: string;
  createdAt: Date;
}

interface CashierDocument {
  _id: string;
  fullName: string;
  username: string;
  isActive: boolean;
  shop: any;
  createdAt: Date;
}

export const getBalanceData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, cashierId, startDate, endDate } = req.query;

    // Build filter conditions
    const shopFilter = shopId && shopId !== 'all' ? { _id: shopId } : {};
    const cashierFilter = cashierId && cashierId !== 'all' ? { _id: cashierId } : {};

    // Get shops with balance data
    const shops = await DatabaseService.findAll<ShopDocument>(
      Shop,
      res,
      'shops',
      {
        filter: shopFilter,
        populate: { path: 'owner', select: 'fullName username' },
        select: 'shopName margin status createdAt'
      }
    );

    // Get cashiers for the selected shop
    const cashiers = await DatabaseService.findAll<CashierDocument>(
      Cashier,
      res,
      'cashiers',
      {
        filter: {
          ...cashierFilter,
          ...(shopId && shopId !== 'all' ? { shop: shopId } : {})
        },
        populate: { path: 'shop', select: 'shopName' },
        select: 'fullName username shop isActive createdAt'
      }
    );

    // Always return arrays, even if null
    const shopsArray = shops || [];
    const cashiersArray = cashiers || [];

    // Import Bet model for real transaction data
    const Bet = (await import('../models/Bet')).default;
    const Game = (await import('../models/Game')).default;
    const CompletedGame = (await import('../models/CompletedGame')).default;

    // Generate balance data for each shop with REAL transaction data
    const balanceData = await Promise.all(shopsArray.map(async (shop) => {
      const shopIdStr = (shop._id as any).toString();
      
      // Build date filter for transactions
      let dateFilter = {};
      if (startDate && endDate) {
        // Handle timezone properly: create local date boundaries that work with MongoDB UTC storage
        const startDateStr = startDate as string;
        const endDateStr = endDate as string;
        
        // Create start of day in local timezone
        const startDateObj = new Date(startDateStr + 'T00:00:00');
        // Create end of day in local timezone
        const endDateObj = new Date(endDateStr + 'T23:59:59.999');
        
        dateFilter = {
          placedAt: {
            $gte: startDateObj,
            $lte: endDateObj
          }
        };
      }

      // Get all cashiers for this shop
      const shopCashiers = cashiersArray.filter(cashier => 
        cashier.shop && (cashier.shop as any)._id.toString() === shopIdStr
      );
      
      const cashierIds = shopCashiers.map(cashier => cashier._id);

      // Always use the date filter - no fallback logic
      const effectiveDateFilter = dateFilter;

      // Debug: Check if there are any bets for this shop at all
      const totalBetsForShop = await Bet.countDocuments({ cashierId: { $in: cashierIds } });
      
      // Debug: Check if there are any bets in the date range
      const totalBetsInDateRange = await Bet.countDocuments({ ...effectiveDateFilter });
      
      // Debug: Check if there are any bets for this shop in the date range
      const totalBetsForShopInDateRange = await Bet.countDocuments({ 
        cashierId: { $in: cashierIds }, 
        ...effectiveDateFilter 
      });

      // Calculate REAL financial data from transactions
      const [
        totalTickets,
        totalBets,
        totalRedeemed,
        totalUnclaimed,
        shopProfit
      ] = await Promise.all([
        // Total tickets created
        Bet.countDocuments({
          cashierId: { $in: cashierIds },
          ...effectiveDateFilter
        }),
        
        // Total bets placed (sum of all stakes)
        Bet.aggregate([
          {
            $match: {
              cashierId: { $in: cashierIds },
              betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
              ...effectiveDateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$stake' }
            }
          }
        ]).then(result => result[0]?.total || 0),
        
        // Total redeemed (sum of all wins)
        Bet.aggregate([
          {
            $match: {
              cashierId: { $in: cashierIds },
              betStatus: { $in: ['won_redeemed', 'lost_redeemed'] },
              ...effectiveDateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$win' }
            }
          }
        ]).then(result => result[0]?.total || 0),
        
        // Total unclaimed (pending bets that haven't been settled + won/lost tickets that haven't been redeemed)
        // IMPORTANT: Don't filter by date for unclaimed - show ALL pending/won/lost tickets regardless of placement date
        Bet.aggregate([
          {
            $match: {
              cashierId: { $in: cashierIds },
              betStatus: { $in: ['pending', 'active', 'won', 'lost'] } // Include pending (before game ends) and won/lost (after game ends)
              // Removed date filter for unclaimed calculation
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$stake' }
            }
          }
        ]).then(result => result[0]?.total || 0),
        
        // Shop profit (shop margin from total bets)
        Bet.aggregate([
          {
            $match: {
              cashierId: { $in: cashierIds },
              betStatus: { $in: ['pending', 'active', 'won', 'lost', 'won_redeemed', 'lost_redeemed'] },
              ...effectiveDateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$stake' }
            }
          }
        ]).then(result => {
          const totalStakes = result[0]?.total || 0;
          return (totalStakes * shop.margin) / 100;
        })
      ]);

      return {
        shopId: shopIdStr,
        shopName: shop.shopName,
        totalTickets,
        totalBets,
        totalUnclaimed,
        totalRedeemed,
        shopProfit: Math.round(shopProfit * 100) / 100, // Round to 2 decimal places
        lastUpdated: new Date().toISOString()
      };
    }));

    ResponseService.success(res, {
      balanceData,
      shops: shopsArray,
      cashiers: cashiersArray
    });

  } catch (error) {
    console.error('Error in getBalanceData:', error);
    ResponseService.serverError(res, 'Failed to fetch balance data');
  }
};

export const getCashierDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate, cashierId } = req.query;

    if (!shopId) {
      ResponseService.validationError(res, 'Shop ID is required');
      return;
    }

    // Build date filter for bets
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // End of day
      dateFilter = {
        createdAt: {
          $gte: start,
          $lte: end
        }
      };
    }

    // Build cashier filter
    let cashierFilter: any = { shop: shopId };
    if (cashierId && cashierId !== 'all') {
      cashierFilter = { ...cashierFilter, _id: cashierId };
    }

    // Get cashiers for the specific shop
    const cashiers = await DatabaseService.findAll<CashierDocument>(
      Cashier,
      res,
      'cashiers',
      {
        filter: cashierFilter,
        populate: { path: 'shop', select: 'shopName' },
        select: 'fullName username isActive createdAt'
      }
    );

    // Always return array, even if null
    const cashiersArray = cashiers || [];

    // Import Bet model for real transaction data
    const Bet = (await import('../models/Bet')).default;

    // Generate cashier details with REAL transaction data
    const cashierDetails = await Promise.all(cashiersArray.map(async (cashier) => {
      const cashierIdStr = (cashier._id as any).toString();
      const cashierObjectId = new mongoose.Types.ObjectId(cashierIdStr); // Convert to ObjectId
      
      // Debug: Check if there are any bets for this cashier at all
      const totalBetsForCashier = await Bet.countDocuments({ 
        cashierId: cashierObjectId,
        ...dateFilter
      });
      
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
        // Total tickets created by this cashier (excluding cancelled)
        Bet.countDocuments({
          cashierId: cashierObjectId, // Use ObjectId
          betStatus: { $ne: 'cancelled' }, // Exclude cancelled tickets
          ...dateFilter
        }),
        
        // Total bets placed by this cashier (sum of all stakes)
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
        
        // Total unclaimed (pending bets that haven't been settled)
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
        
        // Total redeemed (sum of win amounts)
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
        
        // Net balance (total bets - total redeemed)
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

      return {
        cashierId: cashierIdStr,
        cashierName: cashier.username,
        shopName: cashier.shop?.shopName || 'N/A',
        tickets,
        bets,
        unclaimed,
        redeemed,
        netBalance: Math.round(netBalance * 100) / 100, // Round to 2 decimal places
        unclaimedCount,
        redeemCount,
        status: cashier.isActive ? 'active' : 'inactive'
      };
    }));

    ResponseService.success(res, cashierDetails);
  } catch (error) {
    console.error('Error in getCashierDetails:', error);
    ResponseService.serverError(res, 'Failed to fetch cashier details');
  }
}; 