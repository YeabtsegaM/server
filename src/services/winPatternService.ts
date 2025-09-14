import { IWinPattern } from '../models/WinPattern';
import { ICartela } from '../models/Cartela';

// Type for lean query results
type WinPatternLean = {
  _id: string;
  name: string;
  pattern: boolean[][];
  isActive: boolean;
  cashierId: string;
  shopId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface PatternMatchResult {
  isWinner: boolean;
  matchedPatterns: string[]; // Changed from single pattern to array of patterns
  matchedNumbers: number[];
  matchTimestamp: Date;
  patternNames: string[]; // Changed from single pattern name to array of names
  allMatchedPatterns: Array<{
    patternId: string;
    patternName: string;
    matchedNumbers: number[];
  }>; // New field to store all matching patterns with details
}

export class WinPatternService {
  private static patternCache = new Map<string, WinPatternLean[]>();
  private static cacheExpiry = new Map<string, number>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached active win patterns for a cashier
   */
  private static async getCachedPatterns(cashierId: string): Promise<WinPatternLean[]> {
    const cacheKey = `patterns_${cashierId}`;
    const now = Date.now();
    
    // Check if cache is valid
    if (this.patternCache.has(cacheKey) && 
        this.cacheExpiry.has(cacheKey) && 
        now < this.cacheExpiry.get(cacheKey)!) {
      return this.patternCache.get(cacheKey)!;
    }

    // Fetch fresh patterns from database
    const { WinPattern } = await import('../models/WinPattern');
    const patterns = await WinPattern.find({ 
      cashierId, 
      isActive: true 
    }).lean() as unknown as WinPatternLean[];

    // Cache the patterns
    this.patternCache.set(cacheKey, patterns);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

    return patterns;
  }

  /**
   * Convert 2D cartela pattern to flat array of numbers
   */
  private static cartelaPatternToNumbers(cartela: ICartela): number[] {
    const numbers: number[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (cartela.pattern[i][j] !== 0) { // Skip center (free space)
          numbers.push(cartela.pattern[i][j]);
        }
      }
    }
    return numbers;
  }

  /**
   * High-performance pattern matching for a single cartela
   * Now supports multiple active patterns and returns all matches
   */
  static async checkCartelaWin(
    cartela: ICartela, 
    drawnNumbers: number[], 
    cashierId: string
  ): Promise<PatternMatchResult> {
    try {
      const patterns = await this.getCachedPatterns(cashierId);
      
      if (patterns.length === 0) {
        return {
          isWinner: false,
          matchedPatterns: [],
          matchedNumbers: [],
          matchTimestamp: new Date(),
          patternNames: [],
          allMatchedPatterns: []
        };
      }

      // Convert cartela pattern to flat array of numbers
      const cartelaNumbers = this.cartelaPatternToNumbers(cartela);
      const cartelaNumbersSet = new Set(cartelaNumbers);
      const drawnSet = new Set(drawnNumbers);
      
      // Center is always free (counts as matched)
      const centerNumber = 0; // Center is always 0 (free space)
      
      // Check ALL patterns and collect all matches
      const allMatches: Array<{
        patternId: string;
        patternName: string;
        matchedNumbers: number[];
      }> = [];
      
      for (const pattern of patterns) {
        const matchResult = this.matchPattern(cartelaNumbersSet, drawnSet, pattern, centerNumber, cartela);
        if (matchResult.isWinner) {
          allMatches.push({
            patternId: pattern._id,
            patternName: pattern.name,
            matchedNumbers: matchResult.matchedNumbers
          });
        }
      }

      // If we have any matches, the cartela is a winner
      if (allMatches.length > 0) {
        // Combine all matched numbers (remove duplicates)
        const allMatchedNumbers = [...new Set(allMatches.flatMap(match => match.matchedNumbers))];
        
        return {
          isWinner: true,
          matchedPatterns: allMatches.map(match => match.patternId),
          matchedNumbers: allMatchedNumbers,
          matchTimestamp: new Date(),
          patternNames: allMatches.map(match => match.patternName),
          allMatchedPatterns: allMatches
        };
      }

      return {
        isWinner: false,
        matchedPatterns: [],
        matchedNumbers: [],
        matchTimestamp: new Date(),
        patternNames: [],
        allMatchedPatterns: []
      };

    } catch (error) {
      console.error('Error checking cartela win:', error);
      return {
        isWinner: false,
        matchedPatterns: [],
        matchedNumbers: [],
        matchTimestamp: new Date(),
        patternNames: [],
        allMatchedPatterns: []
      };
    }
  }

  /**
   * Efficient pattern matching algorithm
   */
  private static matchPattern(
    cartelaNumbers: Set<number>,
    drawnNumbers: Set<number>,
    pattern: WinPatternLean,
    centerNumber: number,
    cartela: ICartela
  ): PatternMatchResult {
    try {
      // Get pattern positions from 2D boolean array
      const patternPositions: number[] = [];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (pattern.pattern[i][j]) {
            patternPositions.push(i * 5 + j); // Convert 2D to 1D index
          }
        }
      }
      
      if (patternPositions.length === 0) {
        return {
          isWinner: false,
          matchedPatterns: [],
          matchedNumbers: [],
          matchTimestamp: new Date(),
          patternNames: [],
          allMatchedPatterns: []
        };
      }

      const matchedNumbers: number[] = [];
      let matchedCount = 0;

      // Check each position in the pattern
      for (const position of patternPositions) {
        const row = Math.floor(position / 5);
        const col = position % 5;
        
        if (row === 2 && col === 2) {
          // Center position is always free
          matchedCount++;
          matchedNumbers.push(centerNumber);
        } else {
          // Check if the position has a matching number
          const cartelaNumber = cartela.pattern[row][col];
          if (cartelaNumber !== 0 && drawnNumbers.has(cartelaNumber)) {
            matchedCount++;
            matchedNumbers.push(cartelaNumber);
          }
        }
      }

      // Check if pattern is complete
      const isWinner = matchedCount === patternPositions.length;

      return {
        isWinner,
        matchedPatterns: isWinner ? [pattern._id] : [],
        matchedNumbers: isWinner ? matchedNumbers : [],
        matchTimestamp: new Date(),
        patternNames: isWinner ? [pattern.name] : [],
        allMatchedPatterns: isWinner ? [{
          patternId: pattern._id,
          patternName: pattern.name,
          matchedNumbers: matchedNumbers
        }] : []
      };

    } catch (error) {
      console.error('Error matching pattern:', error);
      return {
        isWinner: false,
        matchedPatterns: [],
        matchedNumbers: [],
        matchTimestamp: new Date(),
        patternNames: [],
        allMatchedPatterns: []
      };
    }
  }

  /**
   * Batch check multiple cartelas for performance
   */
  static async checkMultipleCartelas(
    cartelas: ICartela[],
    drawnNumbers: number[],
    cashierId: string
  ): Promise<Map<string, PatternMatchResult>> {
    const results = new Map<string, PatternMatchResult>();
    
    // Process cartelas in parallel for better performance
    const promises = cartelas.map(async (cartela) => {
      const result = await this.checkCartelaWin(cartela, drawnNumbers, cashierId);
      return { cartelaId: cartela.cartelaId, result };
    });

    const resolvedResults = await Promise.all(promises);
    
    // Build results map
    for (const { cartelaId, result } of resolvedResults) {
      results.set(cartelaId.toString(), result);
    }

    return results;
  }

  /**
   * Clear cache for a specific cashier (when patterns change)
   */
  static clearCache(cashierId: string): void {
    const cacheKey = `patterns_${cashierId}`;
    this.patternCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
  }

  /**
   * Clear all caches (for maintenance)
   */
  static clearAllCaches(): void {
    this.patternCache.clear();
    this.cacheExpiry.clear();
  }
}

export default WinPatternService;
