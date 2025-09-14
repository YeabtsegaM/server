import { Server } from 'socket.io';
import GameService from '../services/gameService';
export declare class SocketManager {
    private io;
    private gameService;
    private cashierHandler;
    private displayHandler;
    private adminHandler;
    constructor(io: Server);
    private setupConnectionHandler;
    getGameService(): GameService;
}
//# sourceMappingURL=socketManager.d.ts.map