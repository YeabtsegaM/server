import axios from 'axios';

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

class PrinterService {
  private printerAgentUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    this.printerAgentUrl = process.env.PRINTER_AGENT_URL || 'http://localhost:6060';
  }

  /**
   * Check if Printer Agent is connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log('🔍 DEBUG: Checking printer connection to:', this.printerAgentUrl);
      // Try to send a simple print request instead of health check
      const response = await axios.post(`${this.printerAgentUrl}/print`, {
        jobId: `connection-test-${Date.now()}`,
        type: 'ticket',
        content: 'Connection test'
      }, {
        timeout: 5000
      });
      console.log('🔍 DEBUG: Printer connection test response:', response.status);
      return response.status === 200;
    } catch (error: any) {
      console.error('🔍 DEBUG: Printer connection check failed:', error.message);
      console.log('Printer Agent: Not Connected');
      return false;
    }
  }

  /**
   * Print a Bingo ticket
   */
  async printBingoTicket(ticketData: BingoTicketData): Promise<PrintResponse> {
    try {
      console.log('🖨️ Attempting to print Bingo ticket:', ticketData.ticketNumber);
      
      // Format the ticket content properly
      const ticketContent = this.formatBingoTicket(ticketData);
      
      const response = await axios.post(`${this.printerAgentUrl}/print`, {
        jobId: `bingo-${Date.now()}`,
        type: 'ticket', // Use 'ticket' type instead of 'bingo'
        content: ticketContent
      }, {
        timeout: 30000 // Increased timeout to 30 seconds
      });

      if (response.status === 200) {
        console.log('✅ Bingo ticket printed successfully:', ticketData.ticketNumber);
        return {
          success: true,
          message: `Ticket ${ticketData.ticketNumber} printed successfully`
        };
      } else {
        throw new Error(`Print failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Bingo print error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown print error'
      };
    }
  }

  /**
   * Format Bingo ticket content for printing
   */
  private formatBingoTicket(ticketData: BingoTicketData): string {
    const dateTime = new Date(ticketData.dateTime).toISOString().replace('T', ' ').replace('Z', ' (UTC)');
    const cartelaGrid = this.formatCartelaGrid(ticketData.cartelaNumbers);
    
    // Extract first name only (before the first space)
    const firstName = ticketData.cashierFirstName.split(' ')[0];
    
    // Calculate the end position of the game line for alignment
    const gameLine = `Bingo #${ticketData.gameId} #${ticketData.cartelaId} #Stack : Br ${ticketData.stake.toFixed(2)}`;
    const stackEndPosition = gameLine.length;
    
    // Right-aligned header details that end at the same position as stack amount
    const ticketNumberLine = ' '.repeat(stackEndPosition - ticketData.ticketNumber.length) + ticketData.ticketNumber;
    const firstNameLine = ' '.repeat(stackEndPosition - firstName.length) + firstName;
    const usernameLine = ' '.repeat(stackEndPosition - ticketData.cashierUsername.length) + ticketData.cashierUsername;
    const dateTimeLine = ' '.repeat(stackEndPosition - dateTime.length) + dateTime;
    
    return `${ticketNumberLine}
${firstNameLine}
${usernameLine}
${dateTimeLine}
${gameLine}
${cartelaGrid}
[BARCODE:${ticketData.ticketNumber}]`;
  }

  /**
   * Format cartela numbers into a 5x5 grid with asterisk for zero
   */
  private formatCartelaGrid(numbers: number[]): string {
    if (!numbers || numbers.length !== 25) {
      // If no numbers provided, use default cartela numbers
      const defaultNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
      return this.formatGrid(defaultNumbers);
    }
    
    return this.formatGrid(numbers);
  }

  /**
   * Format numbers into a 5x5 grid
   */
  private formatGrid(numbers: number[]): string {
    let grid = '';
    for (let i = 0; i < 5; i++) {
      const row = numbers.slice(i * 5, (i + 1) * 5);
      grid += row.map(num => num === 0 ? '★' : num.toString().padStart(2, '0')).join(' ') + '\n';
    }
    return grid;
  }

  /**
   * Print multiple Bingo tickets (for batch printing)
   */
  async printMultipleBingoTickets(tickets: BingoTicketData[]): Promise<PrintResponse[]> {
    const results: PrintResponse[] = [];
    
    for (const ticket of tickets) {
      const result = await this.printBingoTicket(ticket);
      results.push(result);
      
      // Small delay between prints to avoid overwhelming the printer
      if (tickets.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay to 2 seconds
      }
    }
    
    return results;
  }
}

export const printerService = new PrinterService();
export type { BingoTicketData, PrintResponse };
