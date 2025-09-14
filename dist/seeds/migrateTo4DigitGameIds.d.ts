/**
 * Database Migration Script: 6-digit to 4-digit Game IDs
 *
 * This script will:
 * 1. Clean all existing games with old 6-digit IDs
 * 2. Reset all cashier game IDs to 4000
 * 3. Update database schema for new 4-digit system
 * 4. Ensure database is ready for new game ID system
 *
 * RUN THIS SCRIPT BEFORE STARTING THE NEW SYSTEM!
 */
declare function migrateTo4DigitGameIds(): Promise<void>;
export default migrateTo4DigitGameIds;
//# sourceMappingURL=migrateTo4DigitGameIds.d.ts.map