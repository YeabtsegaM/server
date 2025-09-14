"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinPatternService = void 0;
class WinPatternService {
    /**
     * Get cached active win patterns for a cashier
     */
    static async getCachedPatterns(cashierId) {
        const cacheKey = `patterns_${cashierId}`;
        const now = Date.now();
        // Check if cache is valid
        if (this.patternCache.has(cacheKey) &&
            this.cacheExpiry.has(cacheKey) &&
            now < this.cacheExpiry.get(cacheKey)) {
            return this.patternCache.get(cacheKey);
        }
        // Fetch fresh patterns from database
        const { WinPattern } = await Promise.resolve().then(() => __importStar(require('../models/WinPattern')));
        const patterns = await WinPattern.find({
            cashierId,
            isActive: true
        }).lean();
        // Cache the patterns
        this.patternCache.set(cacheKey, patterns);
        this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);
        return patterns;
    }
    /**
     * Convert 2D cartela pattern to flat array of numbers
     */
    static cartelaPatternToNumbers(cartela) {
        const numbers = [];
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
    static async checkCartelaWin(cartela, drawnNumbers, cashierId) {
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
            const allMatches = [];
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
        }
        catch (error) {
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
    static matchPattern(cartelaNumbers, drawnNumbers, pattern, centerNumber, cartela) {
        try {
            // Get pattern positions from 2D boolean array
            const patternPositions = [];
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
            const matchedNumbers = [];
            let matchedCount = 0;
            // Check each position in the pattern
            for (const position of patternPositions) {
                const row = Math.floor(position / 5);
                const col = position % 5;
                if (row === 2 && col === 2) {
                    // Center position is always free
                    matchedCount++;
                    matchedNumbers.push(centerNumber);
                }
                else {
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
        }
        catch (error) {
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
    static async checkMultipleCartelas(cartelas, drawnNumbers, cashierId) {
        const results = new Map();
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
    static clearCache(cashierId) {
        const cacheKey = `patterns_${cashierId}`;
        this.patternCache.delete(cacheKey);
        this.cacheExpiry.delete(cacheKey);
    }
    /**
     * Clear all caches (for maintenance)
     */
    static clearAllCaches() {
        this.patternCache.clear();
        this.cacheExpiry.clear();
    }
}
exports.WinPatternService = WinPatternService;
WinPatternService.patternCache = new Map();
WinPatternService.cacheExpiry = new Map();
WinPatternService.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
exports.default = WinPatternService;
//# sourceMappingURL=winPatternService.js.map