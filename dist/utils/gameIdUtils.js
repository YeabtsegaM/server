"use strict";
/**
 * NEW Game ID Utility Functions - 4-digit system (4000-4999)
 *
 * Provides utility functions for handling clean 4-digit game IDs
 * across the application for consistent game ID handling.
 * Includes date & time stamps for easy identification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGameId = generateGameId;
exports.formatGameIdForDisplay = formatGameIdForDisplay;
exports.isValidGameIdFormat = isValidGameIdFormat;
exports.getGameIdNumber = getGameIdNumber;
exports.compareGameIds = compareGameIds;
exports.isValidGameIdRange = isValidGameIdRange;
exports.generateGameIdWithTimestamp = generateGameIdWithTimestamp;
exports.parseTimestampedGameId = parseTimestampedGameId;
exports.shouldResetGameId = shouldResetGameId;
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
function generateGameId(sequentialId) {
    return sequentialId.toString();
}
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
function formatGameIdForDisplay(gameId, includeTimestamp = false) {
    if (!gameId)
        return '0';
    let gameIdStr;
    if (typeof gameId === 'number') {
        gameIdStr = gameId.toString();
    }
    else {
        gameIdStr = gameId;
    }
    if (includeTimestamp) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
        return `${gameIdStr} (${dateStr} ${timeStr})`;
    }
    return gameIdStr;
}
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
function isValidGameIdFormat(gameId) {
    if (!gameId)
        return false;
    const gameIdStr = gameId.toString();
    // Check if it's exactly 4 digits and in range 4000-4999
    if (!/^\d{4}$/.test(gameIdStr))
        return false;
    const gameIdNum = parseInt(gameIdStr, 10);
    return gameIdNum >= 4000 && gameIdNum <= 4999;
}
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
function getGameIdNumber(gameId) {
    if (!gameId)
        return 0;
    if (typeof gameId === 'number') {
        return gameId;
    }
    const parsedId = parseInt(gameId, 10);
    return isNaN(parsedId) ? 0 : parsedId;
}
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
function compareGameIds(gameId1, gameId2) {
    const num1 = getGameIdNumber(gameId1);
    const num2 = getGameIdNumber(gameId2);
    if (num1 < num2)
        return -1;
    if (num1 > num2)
        return 1;
    return 0;
}
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
function isValidGameIdRange(gameId) {
    const num = getGameIdNumber(gameId);
    return num >= 4000 && num <= 4999;
}
/**
 * Generate a game ID with timestamp for logging and identification
 *
 * @param gameId - The base game ID
 * @returns Game ID with timestamp for easy identification
 *
 * @example
 * generateGameIdWithTimestamp(4000) // returns "4000_2024-01-15_14:30:25"
 */
function generateGameIdWithTimestamp(gameId) {
    const baseId = gameId.toString();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-MM-SS
    return `${baseId}_${timestamp}`;
}
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
function parseTimestampedGameId(timestampedGameId) {
    const parts = timestampedGameId.split('_');
    if (parts.length < 2)
        return null;
    const baseId = parts[0];
    const timestamp = parts.slice(1).join('_').replace(/-/g, ':');
    return { baseId, timestamp };
}
/**
 * Check if a game ID needs daily reset (for 4-digit system)
 *
 * @param currentGameId - The current game ID
 * @param lastGameDate - The last game date
 * @returns True if the game ID should be reset to 4000
 */
function shouldResetGameId(currentGameId, lastGameDate) {
    if (!lastGameDate)
        return true;
    const today = new Date();
    const lastGame = new Date(lastGameDate);
    return today.getDate() !== lastGame.getDate() ||
        today.getMonth() !== lastGame.getMonth() ||
        today.getFullYear() !== lastGame.getFullYear();
}
//# sourceMappingURL=gameIdUtils.js.map