"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSocketHandler = void 0;
const ShopOwner_1 = __importDefault(require("../models/ShopOwner"));
const Shop_1 = __importDefault(require("../models/Shop"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
class AdminSocketHandler {
    constructor(gameService, io) {
        this.gameService = gameService;
        this.io = io;
    }
    async handleConnection(socket) {
        socket.join('admin');
        // Send initial dashboard data
        await this.sendDashboardUpdate(socket);
        // Send current active games to admin
        const activeGames = await this.gameService.getActiveGames();
        socket.emit('active_games_update', activeGames);
        // Setup admin event handlers
        this.setupEventHandlers(socket);
    }
    setupEventHandlers(socket) {
        socket.on('request_dashboard_update', async () => {
            await this.sendDashboardUpdate(socket);
        });
        socket.on('request_active_games', async () => {
            const activeGames = await this.gameService.getActiveGames();
            socket.emit('active_games_update', activeGames);
        });
        socket.on('request_game_session_info', async (sessionId) => {
            const gameSession = this.gameService.getGameSession(sessionId);
            if (gameSession) {
                socket.emit('game_session_info', gameSession);
            }
        });
        socket.on('disconnect', () => {
            console.log(`❌ Admin disconnected: ${socket.id}`);
        });
    }
    async sendDashboardUpdate(socket) {
        try {
            const [totalShopOwners, activeShopOwners, totalShops, activeShops, totalCashiers, activeCashiers, recentShopOwners, recentShops, recentCashiers] = await Promise.all([
                ShopOwner_1.default.countDocuments(),
                ShopOwner_1.default.countDocuments({ isActive: true }),
                Shop_1.default.countDocuments(),
                Shop_1.default.countDocuments({ status: 'active' }),
                Cashier_1.default.countDocuments(),
                Cashier_1.default.countDocuments({ isActive: true }),
                ShopOwner_1.default.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('fullName username isActive createdAt'),
                Shop_1.default.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('shopName location status createdAt')
                    .populate('owner', 'fullName username firstName lastName'),
                Cashier_1.default.find()
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
        }
        catch (error) {
            console.error('❌ sendDashboardUpdate: Error sending dashboard update:', error);
            socket.emit('dashboard_update', {
                success: false,
                error: 'Failed to fetch dashboard data'
            });
        }
    }
}
exports.AdminSocketHandler = AdminSocketHandler;
//# sourceMappingURL=adminSocket.js.map