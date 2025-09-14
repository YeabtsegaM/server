/**
 * Generate a unique session ID
 */
export declare const generateSessionId: () => string;
/**
 * Generate display URL with session ID
 */
export declare const generateDisplayUrl: (sessionId: string, baseUrl?: string) => string;
/**
 * Generate BAT command for a cashier (on demand)
 */
export declare const generateBatCommand: (sessionId: string) => Promise<string>;
/**
 * Initialize or update global configuration
 */
export declare const initializeGlobalConfig: () => Promise<void>;
/**
 * Update global configuration
 */
export declare const updateGlobalConfig: (updates: {
    batTemplate?: string;
    displayBaseUrl?: string;
    shopMargin?: number;
    systemFee?: number;
}) => Promise<void>;
/**
 * Get global configuration
 */
export declare const getGlobalConfig: () => Promise<(import("mongoose").Document<unknown, {}, import("../models/GlobalConfig").IGlobalConfig, {}> & import("../models/GlobalConfig").IGlobalConfig & Required<{
    _id: unknown;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=sessionUtils.d.ts.map