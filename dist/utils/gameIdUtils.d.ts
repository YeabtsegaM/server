/**
 * NEW Game ID Utility Functions - 4-digit system (4000-4999)
 *
 * Provides utility functions for handling clean 4-digit game IDs
 * across the application for consistent game ID handling.
 * Includes date & time stamps for easy identification.
 */
/**
 * Generate a clean 4-digit game ID from a sequential number
 *
 * @param sequentialId - The sequential game ID number (4000-4999)
 * @returns A clean 4-digit game ID string
 *
 * @example
 * generateGameId(4000) // returns "4000"
 * generateGameId(4001) // returns "4001"
 * generateGameId(4999) // returns "4999"
 */
export declare function generateGameId(sequentialId: number): string;
/**
 * Format game ID for display with optional timestamp
 *
 * @param gameId - The game ID (can be string or number)
 * @param includeTimestamp - Whether to include date & time stamp
 * @returns Formatted game ID for display
 *
 * @example
 * formatGameIdForDisplay("4000") // returns "4000"
 * formatGameIdForDisplay(4001) // returns "4001"
 * formatGameIdForDisplay("4000", true) // returns "4000 (2024-01-15 14:30)"
 */
export declare function formatGameIdForDisplay(gameId: string | number | undefined, includeTimestamp?: boolean): string;
/**
 * Validate if a game ID has the correct 4-digit format (4000-4999)
 *
 * @param gameId - The game ID string to validate
 * @returns True if the game ID format is valid (4 digits, 4000-4999)
 *
 * @example
 * isValidGameIdFormat("4000") // returns true
 * isValidGameIdFormat("4001") // returns true
 * isValidGameIdFormat("4999") // returns true
 * isValidGameIdFormat("1234") // returns false (too small)
 * isValidGameIdFormat("5000") // returns false (too large)
 * isValidGameIdFormat("abc123") // returns false (not numeric)
 */
export declare function isValidGameIdFormat(gameId: string | number): boolean;
/**
 * Get the numeric value from a game ID
 *
 * @param gameId - The game ID string or number
 * @returns The numeric value of the game ID
 *
 * @example
 * getGameIdNumber("4000") // returns 4000
 * getGameIdNumber(4001) // returns 4001
 * getGameIdNumber("4999") // returns 4999
 */
export declare function getGameIdNumber(gameId: string | number | undefined): number;
/**
 * Compare two game IDs by their numeric values
 *
 * @param gameId1 - First game ID
 * @param gameId2 - Second game ID
 * @returns -1 if gameId1 < gameId2, 0 if equal, 1 if gameId1 > gameId2
 *
 * @example
 * compareGameIds("4000", "4001") // returns -1
 * compareGameIds("4001", "4000") // returns 1
 * compareGameIds("4000", "4000") // returns 0
 */
export declare function compareGameIds(gameId1: string | number, gameId2: string | number): number;
/**
 * Check if a game ID is in the valid 4-digit range (4000-4999)
 *
 * @param gameId - The game ID to check
 * @returns True if the game ID is in valid range (4000-4999)
 *
 * @example
 * isValidGameIdRange("4000") // returns true
 * isValidGameIdRange("4999") // returns true
 * isValidGameIdRange("3999") // returns false (too small)
 * isValidGameIdRange("5000") // returns false (too large)
 */
export declare function isValidGameIdRange(gameId: string | number): boolean;
/**
 * Generate a game ID with timestamp for logging and identification
 *
 * @param gameId - The base game ID
 * @returns Game ID with timestamp for easy identification
 *
 * @example
 * generateGameIdWithTimestamp(4000) // returns "4000_2024-01-15_14:30:25"
 */
export declare function generateGameIdWithTimestamp(gameId: string | number): string;
/**
 * Parse a timestamped game ID to get the base ID and timestamp
 *
 * @param timestampedGameId - The game ID with timestamp
 * @returns Object with base game ID and timestamp
 *
 * @example
 * parseTimestampedGameId("4000_2024-01-15_14-30-25")
 * // returns { baseId: "4000", timestamp: "2024-01-15T14:30:25" }
 */
export declare function parseTimestampedGameId(timestampedGameId: string): {
    baseId: string;
    timestamp: string;
} | null;
/**
 * Check if a game ID needs daily reset (for 4-digit system)
 *
 * @param currentGameId - The current game ID
 * @param lastGameDate - The last game date
 * @returns True if the game ID should be reset to 4000
 */
export declare function shouldResetGameId(currentGameId: number, lastGameDate: Date | null): boolean;
//# sourceMappingURL=gameIdUtils.d.ts.map