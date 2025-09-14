import { Request, Response } from 'express';
import ShopOwner from '../models/ShopOwner';
import Shop from '../models/Shop';
import Admin from '../models/Admin';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get real statistics from database
    const [
      totalShopOwners,
      activeShopOwners,
      totalShops,
      activeShops,
      totalAdmins,
      recentShopOwners,
      recentShops
    ] = await Promise.all([
      // Total shop owners
      ShopOwner.countDocuments(),
      
      // Active shop owners
      ShopOwner.countDocuments({ isActive: true }),
      
      // Total shops
      Shop.countDocuments(),
      
      // Active shops
      Shop.countDocuments({ status: 'active' }),
      
      // Total admins
      Admin.countDocuments({ isActive: true }),
      
      // Recent shop owners
      ShopOwner.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName username isActive createdAt')
        .populate('owner', 'fullName username'),
      
      // Recent shops
      Shop.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('shopName owner status createdAt')
        .populate('owner', 'fullName username firstName lastName')
    ]);

    const stats = {
      totalShopOwners: {
        value: totalShopOwners
      },
      activeShopOwners: {
        value: activeShopOwners
      },
      totalShops: {
        value: totalShops
      },
      activeShops: {
        value: activeShops
      }
    };

    res.json({
      success: true,
      data: {
        stats,
        recentShopOwners,
        recentShops
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
};

export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const [recentShopOwners, recentShops] = await Promise.all([
      ShopOwner.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName username isActive createdAt lastLogin'),
      
      Shop.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('shopName owner status createdAt')
        .populate('owner', 'fullName username firstName lastName')
    ]);

    res.json({
      success: true,
      data: {
        recentShopOwners,
        recentShops
      }
    });

  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
}; 