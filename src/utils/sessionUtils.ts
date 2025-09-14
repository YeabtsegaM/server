import { v4 as uuidv4 } from 'uuid';
import GlobalConfig from '../models/GlobalConfig';

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return uuidv4();
};

/**
 * Generate display URL with session ID
 */
export const generateDisplayUrl = (sessionId: string, baseUrl?: string): string => {
  const defaultBaseUrl = process.env.DISPLAY_BASE_URL || 'https://displayyebingocom.vercel.app?Bingo=';
  return `${baseUrl || defaultBaseUrl}${sessionId}`;
};

/**
 * Generate BAT command for a cashier (on demand)
 */
export const generateBatCommand = async (sessionId: string): Promise<string> => {
  try {
    // Get global configuration
    const globalConfig = await GlobalConfig.findOne({ id: 'global-config' });
    
    if (!globalConfig) {
      // Use default template if no global config exists
      const defaultTemplate = 'start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen';
      const displayUrl = generateDisplayUrl(sessionId);
      return `${defaultTemplate} "${displayUrl}"`;
    }
    
    const displayUrl = generateDisplayUrl(sessionId, globalConfig.displayBaseUrl);
    return `${globalConfig.batTemplate} "${displayUrl}"`;
  } catch (error) {
    console.error('Error generating BAT command:', error);
    // Fallback to default
    const displayUrl = generateDisplayUrl(sessionId);
    return `start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen "${displayUrl}"`;
  }
};

/**
 * Initialize or update global configuration
 */
export const initializeGlobalConfig = async (): Promise<void> => {
  try {
    const existingConfig = await GlobalConfig.findOne({ id: 'global-config' });
    
    if (!existingConfig) {
      await GlobalConfig.create({
        id: 'global-config',
        batTemplate: 'start "" chrome.exe --new-window --window-position="1920,0" --autoplay-policy=no-user-gesture-required --user-data-dir="C:/tmp/Profiles/4" -kiosk -fullscreen',
        displayBaseUrl: 'https://display-yebingo-com.netlify.app?Bingo='
      });
      console.log('✅ Global configuration initialized');
    }
  } catch (error) {
    console.error('Error initializing global config:', error);
  }
};

/**
 * Update global configuration
 */
export const updateGlobalConfig = async (updates: {
  batTemplate?: string;
  displayBaseUrl?: string;
  shopMargin?: number;
  systemFee?: number;
}): Promise<void> => {
  try {
    await GlobalConfig.findOneAndUpdate(
      { id: 'global-config' },
      { $set: updates },
      { upsert: true, new: true }
    );
    console.log('✅ Global configuration updated');
  } catch (error) {
    console.error('Error updating global config:', error);
    throw error;
  }
};

/**
 * Get global configuration
 */
export const getGlobalConfig = async () => {
  try {
    const config = await GlobalConfig.findOne({ id: 'global-config' });
    return config;
  } catch (error) {
    console.error('Error getting global config:', error);
    return null;
  }
}; 
