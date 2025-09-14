import { Socket } from 'socket.io';
import GameService from '../services/gameService';
import ShopOwner from '../models/ShopOwner';
import Shop from '../models/Shop';
import Cashier from '../models/Cashier';

export class AdminSocketHandler {
  private gameService: GameService;
  private io: any;

  constructor(gameService: GameService, io: any) {
    this.gameService = gameService;
    this.io = io;
  }

  async handleConnection(socket: Socket) {
    socket.join('admin');
    
    // Send initial dashboard data
    await this.sendDashboardUpdate(socket);
    
    // Send current active games to admin
    const activeGames = await this.gameService.getActiveGames();
    socket.emit('active_games_update', activeGames);
    
    // Setup admin event handlers
    this.setupEventHandlers(socket);
  }

  private setupEventHandlers(socket: Socket) {
    socket.on('request_dashboard_update', async () => {
      await this.sendDashboardUpdate(socket);
    });
    
    socket.on('request_active_games', async () => {
      const activeGames = await this.gameService.getActiveGames();
      socket.emit('active_games_update', activeGames);
    });
    
    socket.on('request_game_session_info', async (sessionId: string) => {
      const gameSession = this.gameService.getGameSession(sessionId);
      if (gameSession) {
        socket.emit('game_session_info', gameSession);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`❌ Admin disconnected: ${socket.id}`);
    });
  }

  private async sendDashboardUpdate(socket: Socket) {
    try {
      const [
        totalShopOwners,
        activeShopOwners,
        totalShops,
        activeShops,
        totalCashiers,
        activeCashiers,
        recentShopOwners,
        recentShops,
        recentCashiers
      ] = await Promise.all([
        ShopOwner.countDocuments(),
        ShopOwner.countDocuments({ isActive: true }),
        Shop.countDocuments(),
        Shop.countDocuments({ status: 'active' }),
        Cashier.countDocuments(),
        Cashier.countDocuments({ isActive: true }),
        ShopOwner.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('fullName username isActive createdAt'),
        Shop.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('shopName location status createdAt')
          .populate('owner', 'fullName username firstName lastName'),
        Cashier.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('fullName username isActive createdAt')
      ]);

      const dashboardData = {
        stats: {
          totalShopOwners: { value: totalShopOwners },
          activeShopOwners: { value: activeShopOwners },
          totalShops: { value: totalShops },
          activeShops: { value: activeShops },
          totalCashiers: { value: totalCashiers },
          activeCashiers: { value: activeCashiers }
        },
        recentShopOwners,
        recentShops,
        recentCashiers
      };

      socket.emit('dashboard_update', {
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('❌ sendDashboardUpdate: Error sending dashboard update:', error);
      socket.emit('dashboard_update', {
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }
} 