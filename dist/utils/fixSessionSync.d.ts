/**
 * Fix session synchronization between cashier and display
 * This script updates the cashier's sessionId to match the display connection
 */
export declare function fixSessionSync(): Promise<{
    cashierUpdated: boolean;
    gameUpdated: boolean;
    sessionId: string;
} | undefined>;
//# sourceMappingURL=fixSessionSync.d.ts.map