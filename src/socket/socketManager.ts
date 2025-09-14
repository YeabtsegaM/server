import { Server } from 'socket.io';
import { CashierSocketHandler } from './cashierSocket';
import { DisplaySocketHandler } from './displaySocket';
import { AdminSocketHandler } from './adminSocket';
import GameService from '../services/gameService';

export class SocketManager {
  private io: Server;
  private gameService: GameService;
  private cashierHandler: CashierSocketHandler;
  private displayHandler: DisplaySocketHandler;
  private adminHandler: AdminSocketHandler;

  constructor(io: Server) {
    this.io = io;
    this.gameService = new GameService(io);
    
    // Initialize socket handlers
    this.cashierHandler = new CashierSocketHandler(this.gameService, io);
    this.displayHandler = new DisplaySocketHandler(this.gameService, io);
    this.adminHandler = new AdminSocketHandler(this.gameService, io);
    
    this.setupConnectionHandler();
  }

  private setupConnectionHandler() {
    this.io.on('connection', async (socket) => {
      const clientType = socket.handshake.query.type as string;
      const cashierId = socket.handshake.query.cashierId as string;
      const displayToken = socket.handshake.query.displayToken as string;
      const sessionId = socket.handshake.query.s as string;
      
      console.log(`🔌 New socket connection:`, {
        socketId: socket.id,
        clientType,
        cashierId,
        displayToken,
        sessionId,
        timestamp: new Date()
      });
      
      try {
        if (clientType === 'cashier') {
          await this.cashierHandler.handleConnection(socket, cashierId, sessionId);
        } else if (displayToken || sessionId) {
          await this.displayHandler.handleConnection(socket, displayToken || sessionId);
        } else if (clientType === 'admin') {
          await this.adminHandler.handleConnection(socket);
        } else {
          console.log(`❌ Unauthorized connection attempt:`, { clientType, cashierId, displayToken, sessionId });
          socket.emit('unauthorized');
          socket.disconnect();
        }
        
        // Add disconnect handler for debugging
        socket.on('disconnect', (reason) => {
          console.log(`🔌 Socket disconnected:`, {
            socketId: socket.id,
            clientType,
            cashierId,
            displayToken,
            sessionId,
            reason,
            timestamp: new Date()
          });
        });
        
      } catch (error) {
        console.error('❌ Socket connection error:', error);
        socket.emit('error', { message: 'Connection failed' });
        socket.disconnect();
      }
    });
  }

  public getGameService(): GameService {
    return this.gameService;
  }
}
