import { Socket } from 'socket.io';
import GameService from '../services/gameService';
export declare class AdminSocketHandler {
    private gameService;
    private io;
    constructor(gameService: GameService, io: any);
    handleConnection(socket: Socket): Promise<void>;
    private setupEventHandlers;
    private sendDashboardUpdate;
}
//# sourceMappingURL=adminSocket.d.ts.map