import Cashier from '../models/Cashier';
import Game from '../models/Game';
import { ICashier } from '../models/Cashier';

/**
 * NEW Game ID Service - Manages 4-digit game ID generation (4000-4999)
 * 
 * Features:
 * - 4-digit game IDs from 4000 to 4999
 * - Daily reset to 4000 for each cashier
 * - Sequential incrementing within the same day
 * - Date & time stamps for easy identification
 * - Thread-safe game ID generation
 * - Performance optimized with minimal database calls
 * - Prevents game ID duplication
 * - Ensures continuity after server restarts
 */
export class GameIdService {
  // Cache for current game IDs to reduce database calls
  private static gameIdCache = new Map<string, { gameId: number; lastUpdated: Date }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MIN_GAME_ID = 4000; // Start from 4000
  private static readonly MAX_GAME_ID = 4999; // Maximum 4999 (4-digit)

  /**
   * Get the current game ID for a cashier
   * If it's a new day, reset to 4000
   * 
   * @param cashierId - The cashier's unique identifier
   * @returns Promise<number> - The current game ID
   * @throws Error if cashier not found or database error
   */
  static async getCurrentGameId(cashierId: string): Promise<number> {
    try {
      // Check cache first for performance
      const cached = this.getFromCache(cashierId);
      if (cached) {
        return cached.gameId;
      }

      const cashier = await this.getCashierWithValidation(cashierId);
      const today = this.getStartOfDay(new Date());

      // Reset game ID if it's a new day
      if (this.shouldResetGameId(cashier, today)) {
        await this.resetGameIdForNewDay(cashier, today);
      }

      // Validate and ensure minimum game ID
      const validatedGameId = this.validateAndNormalizeGameId(cashier.currentGameId);
      
      // Update cache
      this.updateCache(cashierId, validatedGameId);
      
      return validatedGameId;
    } catch (error) {
      console.error('❌ Error getting current game ID:', error);
      throw new Error(`Failed to get current game ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the next available game ID for a cashier
   * This returns the next available game ID without changing the cashier's currentGameId
   * 
   * @param cashierId - The cashier's unique identifier
   * @returns Promise<number> - The next available game ID
   * @throws Error if cashier not found or database error
   */
  static async getNextGameId(cashierId: string): Promise<number> {
    try {
      // CRITICAL FIX: First synchronize with database to ensure accuracy
      const nextAvailableGameId = await this.synchronizeWithDatabase(cashierId);
      
  
      return nextAvailableGameId;
    } catch (error) {
      console.error('❌ Error getting next available game ID:', error);
      throw new Error(`Failed to get next available game ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset game ID to 4000 for a cashier (for testing or manual reset)
   * 
   * @param cashierId - The cashier's unique identifier
   * @returns Promise<number> - The reset game ID
   */
  static async resetGameId(cashierId: string): Promise<number> {
    try {
      const cashier = await this.getCashierWithValidation(cashierId);
      
      // Reset to minimum game ID
      const resetGameId = this.MIN_GAME_ID;
      
      // Update cashier with reset game ID
      await Cashier.findByIdAndUpdate(cashierId, {
        currentGameId: resetGameId,
        lastGameDate: new Date(),
        lastActivity: new Date()
      });
      
      // Clear cache for this cashier
      this.gameIdCache.delete(cashierId);
      
      return resetGameId;
    } catch (error) {
      console.error('❌ Error resetting game ID:', error);
      throw new Error(`Failed to reset game ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * CRITICAL FIX: Synchronize Game ID Service with current database state
   * This ensures the service returns the correct next available game ID
   * 
   * @param cashierId - The cashier's unique identifier
   * @returns Promise<number> - The synchronized next available game ID
   */
  static async synchronizeWithDatabase(cashierId: string): Promise<number> {
    try {
      
      // Get the current game from the database
      const currentGame = await Game.findOne({ 
        cashierId, 
        isConnected: true 
      }).sort({ lastActivity: -1 });
      
      if (!currentGame) {
        return this.MIN_GAME_ID;
      }
      
      const currentGameId = parseInt(currentGame.gameId.toString(), 10);
      
      
      // Calculate the next available game ID
      let nextGameId = currentGameId + 1;
      
      // Ensure we don't exceed maximum (4999)
      if (nextGameId > this.MAX_GAME_ID) {
  
        nextGameId = this.MIN_GAME_ID;
      }
      
      // Update the cashier's currentGameId to match database state
      await Cashier.findByIdAndUpdate(cashierId, {
        currentGameId: currentGameId,
        lastGameDate: new Date(),
        lastActivity: new Date()
      });
      
      // Clear cache for this cashier
      this.gameIdCache.delete(cashierId);
      
      return nextGameId;
      
    } catch (error) {
      console.error('❌ Error synchronizing Game ID Service:', error);
      // Fallback to default behavior
      return this.MIN_GAME_ID;
    }
  }

  /**
   * Get comprehensive game ID info for a cashier
   * 
   * @param cashierId - The cashier's unique identifier
   * @returns Promise<GameIdInfo> - Game ID information
   */
  static async getGameIdInfo(cashierId: string): Promise<{
    currentGameId: number;
    lastGameDate: Date | null;
    isNewDay: boolean;
    cashierName: string;
    nextAvailableGameId: number;
    totalGamesToday: number;
  }> {
    try {
      const cashier = await this.getCashierWithValidation(cashierId);
      const today = this.getStartOfDay(new Date());
      const isNewDay = this.shouldResetGameId(cashier, today);

      // Count total games today for this cashier
      const totalGamesToday = await this.countGamesToday(cashierId, today);

      // Get next available game ID (considering existing games)
      const nextAvailableGameId = await this.findNextAvailableGameId(cashierId, today);

      return {
        currentGameId: this.validateAndNormalizeGameId(cashier.currentGameId),
        lastGameDate: cashier.lastGameDate || null,
        isNewDay,
        cashierName: cashier.username,
        nextAvailableGameId,
        totalGamesToday
      };
    } catch (error) {
      console.error('❌ Error getting game ID info:', error);
      throw new Error(`Failed to get game ID info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear the game ID cache (useful for testing or manual cache management)
   */
  static clearCache(): void {
    this.gameIdCache.clear();
  }

  /**
   * Increment game ID for the next game (called when a game is completed)
   * 
   * @param cashierId - The cashier's unique identifier
   * @returns Promise<number> - The next game ID
   * @throws Error if cashier not found or database error
   */
  static async incrementGameIdForNextGame(cashierId: string): Promise<number> {
    try {
      // CRITICAL FIX: First synchronize with database to ensure accuracy
      const nextGameId = await this.synchronizeWithDatabase(cashierId);
      
      // Update cache
      this.updateCache(cashierId, nextGameId);
      
      return nextGameId;
    } catch (error) {
      console.error('❌ Error incrementing game ID:', error);
      throw new Error(`Failed to increment game ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get information about the next game that will be created
   * 
   * @param cashierId - The cashier's unique identifier
   * @returns Promise<NextGameInfo> - Information about the next game
   */
  static async getNextGameInfo(cashierId: string): Promise<{
    nextGameId: number;
    isNewDay: boolean;
    cashierName: string;
    lastGameDate: Date | null;
    totalGamesToday: number;
    estimatedNextGameTime: Date;
  }> {
    try {
      const cashier = await this.getCashierWithValidation(cashierId);
      const today = this.getStartOfDay(new Date());
      const isNewDay = this.shouldResetGameId(cashier, today);

      // Count total games today for this cashier
      const totalGamesToday = await this.countGamesToday(cashierId, today);

      // Get next available game ID
      const nextGameId = await this.findNextAvailableGameId(cashierId, today);

      // Estimate next game time (immediate for now)
      const estimatedNextGameTime = new Date();

      return {
        nextGameId,
        isNewDay,
        cashierName: cashier.username,
        lastGameDate: cashier.lastGameDate || null,
        totalGamesToday,
        estimatedNextGameTime
      };
    } catch (error) {
      console.error('❌ Error getting next game info:', error);
      throw new Error(`Failed to get next game info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and ensure game ID is within valid range (4000-4999)
   * Prevents invalid game IDs and ensures 4-digit format
   * 
   * @param gameId - The game ID to validate
   * @returns number - Validated and normalized game ID
   */
  private static validateAndNormalizeGameId(gameId: number | undefined): number {
    if (!gameId || gameId < this.MIN_GAME_ID || gameId > this.MAX_GAME_ID) {
      return this.MIN_GAME_ID;
    }
    return gameId;
  }

  /**
   * Find the next available game ID to prevent duplication
   * 
   * @param cashierId - The cashier's unique identifier
   * @param today - The start of today's date
   * @returns Promise<number> - Next available game ID
   */
  private static async findNextAvailableGameId(cashierId: string, today: Date): Promise<number> {
    try {
      // Get current game ID from cashier
      const cashier = await Cashier.findById(cashierId);
      if (!cashier) {
        throw new Error(`Cashier not found: ${cashierId}`);
      }

      let nextGameId = this.validateAndNormalizeGameId(cashier.currentGameId);
      
      // Find the next available game ID by checking existing games
      let attempts = 0;
      const maxAttempts = 1000; // Prevent infinite loops
      
      while (attempts < maxAttempts) {
        // Check if this game ID already exists for today
        const existingGame = await Game.findOne({
          cashierId,
          gameId: nextGameId.toString(),
          createdAt: { $gte: today }
        });

        if (!existingGame) {
          // This game ID is available
          break;
        }

        // Game ID exists, try the next one
        nextGameId++;
        attempts++;

        // Ensure we don't exceed maximum (4999)
        if (nextGameId > this.MAX_GAME_ID) {
         
          nextGameId = this.MIN_GAME_ID;
          // Reset attempts counter for the new range
          attempts = 0;
        }
      }

      if (attempts >= maxAttempts) {
        console.error(`❌ Could not find available game ID after ${maxAttempts} attempts`);
        throw new Error('Unable to generate unique game ID');
      }

      return nextGameId;
    } catch (error) {
      console.error('❌ Error finding next available game ID:', error);
      // Fallback to incrementing current game ID
      const cashier = await Cashier.findById(cashierId);
      const fallbackGameId = this.validateAndNormalizeGameId(cashier?.currentGameId);
      return fallbackGameId + 1;
    }
  }

  /**
   * Count total games today for a cashier
   * 
   * @param cashierId - The cashier's unique identifier
   * @param today - The start of today's date
   * @returns Promise<number> - Total games today
   */
  private static async countGamesToday(cashierId: string, today: Date): Promise<number> {
    try {
      const count = await Game.countDocuments({
        cashierId,
        createdAt: { $gte: today }
      });
      return count;
    } catch (error) {
      console.error('❌ Error counting games today:', error);
      return 0;
    }
  }

  /**
   * Initialize game ID service on server startup
   * Ensures continuity after server restarts
   * 
   * @returns Promise<void>
   */
  static async initializeService(): Promise<void> {
    try {
      console.log('🚀 Initializing NEW 4-digit Game ID Service (4000-4999)...');
      
      // Clear cache on startup
      this.clearCache();
      
      // Validate all cashier game IDs
      const cashiers = await Cashier.find({});
      let validatedCount = 0;
      
      for (const cashier of cashiers) {
        try {
          const originalGameId = cashier.currentGameId;
          const validatedGameId = this.validateAndNormalizeGameId(cashier.currentGameId);
          
          if (originalGameId !== validatedGameId) {
            cashier.currentGameId = validatedGameId;
            await cashier.save();
            console.log(`🔧 Fixed cashier ${cashier.username}: Game ID ${originalGameId} → ${validatedGameId}`);
          }
          
          // Initialize cache
          this.updateCache(cashier._id?.toString() || '', validatedGameId);
          validatedCount++;
        } catch (error) {
          console.error(`❌ Error validating cashier ${cashier.username}:`, error);
        }
      }
      
      console.log(`✅ NEW 4-digit Game ID Service initialized. Validated ${validatedCount} cashiers.`);
    } catch (error) {
      console.error('❌ Error initializing Game ID Service:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Get cashier with validation
   */
  private static async getCashierWithValidation(cashierId: string) {
    const cashier = await Cashier.findById(cashierId);
    if (!cashier) {
      throw new Error(`Cashier not found with ID: ${cashierId}`);
    }
    return cashier;
  }

  /**
   * Check if game ID should be reset for a new day
   */
  private static shouldResetGameId(cashier: ICashier, today: Date): boolean {
    return !cashier.lastGameDate || !this.isSameDay(cashier.lastGameDate, today);
  }

  /**
   * Reset game ID for a new day
   */
  private static async resetGameIdForNewDay(cashier: ICashier, today: Date): Promise<void> {
    cashier.currentGameId = this.MIN_GAME_ID;
    cashier.lastGameDate = today;
    await cashier.save();
    
    console.log(`🎮 Cashier ${cashier.username}: New day, Game ID reset to ${this.MIN_GAME_ID}`);
  }

  /**
   * Check if two dates are the same day
   */
  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Get start of day (midnight) for a given date
   */
  private static getStartOfDay(date: Date): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  /**
   * Get game ID from cache if valid
   */
  private static getFromCache(cashierId: string): { gameId: number; lastUpdated: Date } | null {
    const cached = this.gameIdCache.get(cashierId);
    if (!cached) return null;

    const now = new Date();
    if (now.getTime() - cached.lastUpdated.getTime() > this.CACHE_TTL) {
      this.gameIdCache.delete(cashierId);
      return null;
    }

    return cached;
  }

  /**
   * Update game ID cache
   */
  private static updateCache(cashierId: string, gameId: number): void {
    this.gameIdCache.set(cashierId, {
      gameId,
      lastUpdated: new Date()
    });
  }
}
