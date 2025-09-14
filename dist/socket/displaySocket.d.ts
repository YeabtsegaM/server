import { Socket } from 'socket.io';
import GameService from '../services/gameService';
export declare class DisplaySocketHandler {
    private gameService;
    private io;
    private displaySockets;
    constructor(gameService: GameService, io: any);
    handleConnection(socket: Socket, token: string): Promise<void>;
    private setupEventHandlers;
    /**
     * Setup fast real-time update handlers for immediate updates
     * These handlers provide instant updates without delays
     */
    private setupFastUpdateHandlers;
    /**
     * Setup heartbeat to maintain display connection status
     */
    private setupHeartbeat;
}
//# sourceMappingURL=displaySocket.d.ts.map