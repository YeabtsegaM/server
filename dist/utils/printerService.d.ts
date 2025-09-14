interface BingoTicketData {
    ticketNumber: string;
    cashierFirstName: string;
    cashierUsername: string;
    gameId: string;
    cartelaId: number;
    stake: number;
    cartelaNumbers: number[];
    dateTime: Date;
}
interface PrintResponse {
    success: boolean;
    message?: string;
    error?: string;
}
declare class PrinterService {
    private printerAgentUrl;
    constructor();
    /**
     * Check if Printer Agent is connected
     */
    checkConnection(): Promise<boolean>;
    /**
     * Print a Bingo ticket
     */
    printBingoTicket(ticketData: BingoTicketData): Promise<PrintResponse>;
    /**
     * Format Bingo ticket content for printing
     */
    private formatBingoTicket;
    /**
     * Format cartela numbers into a 5x5 grid with asterisk for zero
     */
    private formatCartelaGrid;
    /**
     * Format numbers into a 5x5 grid
     */
    private formatGrid;
    /**
     * Print multiple Bingo tickets (for batch printing)
     */
    printMultipleBingoTickets(tickets: BingoTicketData[]): Promise<PrintResponse[]>;
}
export declare const printerService: PrinterService;
export type { BingoTicketData, PrintResponse };
//# sourceMappingURL=printerService.d.ts.map