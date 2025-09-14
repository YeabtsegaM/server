import { Request, Response } from 'express';
import Cashier from '../models/Cashier';
import Shop from '../models/Shop';
import Game from '../models/Game';
import { ResponseService } from '../services/responseService';
import { DatabaseService } from '../services/databaseService';
import { generateSessionId, generateDisplayUrl, generateBatCommand } from '../utils/sessionUtils';
import { GameIdService } from '../services/gameIdService';
import { formatGameIdForDisplay, generateGameId } from '../utils/gameIdUtils';
import { GameAggregationService } from '../services/gameAggregationService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    shopId: string;
  };
}

interface CashierDocument {
  _id: any;
  shop: any;
  fullName: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
}

interface ShopDocument {
  _id: any;
  shopName: string;
  location: string;
}

// Transform cashier data for consistent response format
const transformCashierData = (cashier: CashierDocument) => {
  const shopData = cashier.shop as any;
      return {
        _id: cashier._id,
        fullName: cashier.fullName,
        username: cashier.username,
        isActive: cashier.isActive,
        shop: shopData ? {
          _id: shopData._id,
          shopName: shopData.shopName
        } : {
          _id: '',
          shopName: 'Unknown Shop'
        },
        createdAt: cashier.createdAt,
        sessionId: (cashier as any).sessionId,
        displayUrl: (cashier as any).displayUrl,
        isConnected: (cashier as any).isConnected,
        lastActivity: (cashier as any).lastActivity
      };
};

// Get all cashiers - Optimized with service layer
export const getCashiers = async (req: Request, res: Response): Promise<void> => {
  try {
    const cashiers = await DatabaseService.findAll<CashierDocument>(
      Cashier,
      res,
      'cashiers',
      {
        populate: { path: 'shop', select: 'shopName location' },
        select: 'fullName username isActive shop createdAt sessionId displayUrl isConnected lastActivity'
      }
    );

    if (cashiers) {
      const transformedCashiers = cashiers.map(transformCashierData);
      ResponseService.success(res, transformedCashiers);
    }
  } catch (error) {
    console.error('Error in getCashiers:', error);
    ResponseService.serverError(res, 'Failed to fetch cashiers');
  }
};

// Create new cashier
export const createCashier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, username, password, shopId } = req.body;

    // Combine firstName and lastName into fullName
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();

    // Validate required fields
    if (!firstName || !lastName || !username || !password || !shopId) {
      ResponseService.validationError(res, 'First name, last name, username, password, and shop are required');
      return;
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      ResponseService.notFound(res, 'shop');
      return;
    }

    // Check if username already exists
    const existingCashier = await Cashier.findOne({ username });
    if (existingCashier) {
      ResponseService.validationError(res, 'Username already exists');
      return;
    }

    // Generate session ID and display URL
    const sessionId = generateSessionId();
    const displayUrl = generateDisplayUrl(sessionId);

    // Create new cashier with session data
    const cashier = new Cashier({
      fullName,
      username,
      password,
      shop: shopId,
      sessionId,
      displayUrl,
      isConnected: false,
      lastActivity: new Date()
    });

    await cashier.save();

    ResponseService.success(res, {
      ...transformCashierData(cashier),
      sessionId,
      displayUrl
    }, 'Cashier created successfully');

  } catch (error) {
    console.error('Error in createCashier:', error);
    ResponseService.serverError(res, 'Failed to create cashier');
  }
};

// Update cashier
export const updateCashier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, password, shopId, isActive } = req.body;

    // Find cashier
    const cashier = await Cashier.findById(id);
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    // Check if new username conflicts with existing cashier
    if (username && username !== cashier.username) {
      const existingCashier = await Cashier.findOne({ username, _id: { $ne: id } });
      if (existingCashier) {
        ResponseService.validationError(res, 'Username already exists');
        return;
      }
    }

    // Update fields
    if (firstName && lastName) {
      cashier.fullName = `${firstName} ${lastName}`.trim();
    } else if (firstName) {
      const lastName = cashier.fullName.split(' ').slice(1).join(' ') || '';
      cashier.fullName = `${firstName} ${lastName}`.trim();
    } else if (lastName) {
      const firstName = cashier.fullName.split(' ')[0] || '';
      cashier.fullName = `${firstName} ${lastName}`.trim();
    }
    if (username) cashier.username = username;
    if (password) cashier.password = password;
    if (shopId) cashier.shop = shopId;
    if (typeof isActive === 'boolean') cashier.isActive = isActive;

    await cashier.save();

    ResponseService.success(res, transformCashierData(cashier), 'Cashier updated successfully');

  } catch (error) {
    console.error('Error in updateCashier:', error);
    ResponseService.serverError(res, 'Failed to update cashier');
  }
};

// Delete cashier
export const deleteCashier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findByIdAndDelete(id);
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    ResponseService.success(res, null, 'Cashier deleted successfully');

  } catch (error) {
    console.error('Error in deleteCashier:', error);
    ResponseService.serverError(res, 'Failed to delete cashier');
  }
};

// Toggle cashier status
export const toggleCashierStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findById(id);
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    cashier.isActive = !cashier.isActive;
    await cashier.save();

    ResponseService.success(res, transformCashierData(cashier), `Cashier ${cashier.isActive ? 'activated' : 'deactivated'} successfully`);

  } catch (error) {
    console.error('Error in toggleCashierStatus:', error);
    ResponseService.serverError(res, 'Failed to toggle cashier status');
  }
};

// Update cashier session data
export const updateCashierSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sessionId, displayUrl } = req.body;

    const cashier = await Cashier.findById(id);
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    // Update session fields
    if (sessionId) cashier.sessionId = sessionId;
    if (displayUrl) cashier.displayUrl = displayUrl;

    await cashier.save();

    ResponseService.success(res, {
      ...transformCashierData(cashier),
      sessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl
    }, 'Cashier session updated successfully');

  } catch (error) {
    console.error('Error in updateCashierSession:', error);
    ResponseService.serverError(res, 'Failed to update cashier session');
  }
};

// Update cashier connection status
export const updateConnectionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isConnected } = req.body;

    const cashier = await Cashier.findById(id);
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    cashier.isConnected = isConnected;
    cashier.lastActivity = new Date();

    await cashier.save();

    ResponseService.success(res, {
      id: cashier._id,
      isConnected: cashier.isConnected,
      lastActivity: cashier.lastActivity
    }, 'Connection status updated successfully');

  } catch (error) {
    console.error('Error in updateConnectionStatus:', error);
    ResponseService.serverError(res, 'Failed to update connection status');
  }
};

// Regenerate session ID for cashier
export const regenerateSessionId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findById(id);
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    // Generate new session data
    const newSessionId = generateSessionId();
    const newDisplayUrl = generateDisplayUrl(newSessionId);

    // Update cashier with new session data
    cashier.sessionId = newSessionId;
    cashier.displayUrl = newDisplayUrl;
    cashier.isConnected = false;
    cashier.lastActivity = new Date();

    await cashier.save();

    ResponseService.success(res, {
      ...transformCashierData(cashier),
      sessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl
    }, 'Session ID regenerated successfully');

  } catch (error) {
    console.error('Error in regenerateSessionId:', error);
    ResponseService.serverError(res, 'Failed to regenerate session ID');
  }
};

// Get cashier session data
export const getCashierSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findById(id).populate('shop', 'shopName location');
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    ResponseService.success(res, {
      id: cashier._id,
      fullName: cashier.fullName,
      username: cashier.username,
      sessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl,
      isConnected: cashier.isConnected,
      lastActivity: cashier.lastActivity,
      shop: cashier.shop
    });

  } catch (error) {
    console.error('Error in getCashierSession:', error);
    ResponseService.serverError(res, 'Failed to get cashier session');
  }
};

// Get cashier BAT file content
export const getCashierBatFileContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findById(id).populate('shop', 'shopName location');
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    if (!cashier.sessionId) {
      ResponseService.validationError(res, 'Cashier does not have a session ID');
      return;
    }

    // Generate BAT file content using session data
    const displayBatContent = await generateBatCommand(cashier.sessionId);

    ResponseService.success(res, {
      displayBatContent,
      sessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl,
      cashierName: cashier.fullName
    });

  } catch (error) {
    console.error('Error in getCashierBatFileContent:', error);
    ResponseService.serverError(res, 'Failed to get BAT file content');
  }
};

// Get cashier session data for admin
export const getCashierSessionForAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cashier = await Cashier.findById(id).populate('shop', 'shopName location');
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    ResponseService.success(res, {
      id: cashier._id,
      fullName: cashier.fullName,
      username: cashier.username,
      sessionId: cashier.sessionId,
      displayUrl: cashier.displayUrl,
      isConnected: cashier.isConnected,
      lastActivity: cashier.lastActivity,
      shop: cashier.shop,
      isActive: cashier.isActive
    });

  } catch (error) {
    console.error('Error in getCashierSessionForAdmin:', error);
    ResponseService.serverError(res, 'Failed to get cashier session data');
  }
}; 

// Cashier-specific functions (for authenticated cashiers)

interface CashierRequest extends Request {
  cashier?: {
    id: string;
    username: string;
    role: string;
    shopId: string;
  };
}

// Get cashier profile
export const getCashierProfile = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    const cashier = await Cashier.findById(cashierId).populate('shop', 'shopName location');
    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    ResponseService.success(res, {
      id: cashier._id,
      fullName: cashier.fullName,
      username: cashier.username,
      shop: cashier.shop,
      isActive: cashier.isActive,
      createdAt: cashier.createdAt
    });

  } catch (error) {
    console.error('Error in getCashierProfile:', error);
    ResponseService.serverError(res, 'Failed to get cashier profile');
  }
};

// Update cashier profile
export const updateCashierProfile = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    const { fullName, password } = req.body;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (password) updateData.password = password;

    const cashier = await Cashier.findByIdAndUpdate(
      cashierId, 
      updateData, 
      { new: true }
    ).populate('shop', 'shopName location');

    if (!cashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }

    ResponseService.success(res, {
      id: cashier._id,
      fullName: cashier.fullName,
      username: cashier.username,
      shop: cashier.shop,
      isActive: cashier.isActive,
      createdAt: cashier.createdAt
    }, 'Profile updated successfully');

  } catch (error) {
    console.error('Error in updateCashierProfile:', error);
    ResponseService.serverError(res, 'Failed to update cashier profile');
  }
};

// Get cashier settings
export const getCashierSettings = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // For now, return default settings
    // In a real application, these would be stored in a separate settings collection
    const settings = {
      notifications: true,
      autoLogout: 30, // minutes
      theme: 'light',
      language: 'en'
    };

    ResponseService.success(res, settings);

  } catch (error) {
    console.error('Error in getCashierSettings:', error);
    ResponseService.serverError(res, 'Failed to get cashier settings');
  }
};

// Update cashier settings
export const updateCashierSettings = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    const settings = req.body;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // For now, just return success
    // In a real application, these would be stored in a separate settings collection
    ResponseService.success(res, settings, 'Settings updated successfully');

  } catch (error) {
    console.error('Error in updateCashierSettings:', error);
    ResponseService.serverError(res, 'Failed to update cashier settings');
  }
};

  // Game management functions
  export const getCurrentGame = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

      // Get the cashier's active game session
      const game = await Game.findOne({ 
        cashierId, 
        isConnected: true 
      }).sort({ lastActivity: -1 });

      // CRITICAL FIX: Also check for any game with this cashier's sessionId that might be active
      let activeGame = game;
      if (!game || game.status === 'waiting') {
        // Check if there's an active game for this cashier's session
        const cashier = await Cashier.findById(cashierId);
        if (cashier?.sessionId) {
          const sessionGame = await Game.findOne({ 
            sessionId: cashier.sessionId,
            status: 'active'
          }).sort({ lastActivity: -1 });
          
          if (sessionGame) {
            activeGame = sessionGame;
            // Only log when debugging session issues
            // console.log(`🔍 getCurrentGame: Found active game ${sessionGame.gameId} for session ${cashier.sessionId}`);
          }
        }
      }

      // CRITICAL FIX: Check real-time socket connection status
      let realTimeDisplayConnected = false;
      let realTimeCashierConnected = false;
      
      try {
        // Get socket.io instance from app.locals
        const { io } = req.app.locals;
        if (io) {
          // Check if cashier has active socket connections
          const cashierSockets = await io.in(`cashier:${cashierId}`).fetchSockets();
          realTimeCashierConnected = cashierSockets.length > 0;
          
          // Check display connection status for the session
          if (activeGame?.sessionId) {
            const displaySockets = await io.in(`display:${activeGame.sessionId}`).fetchSockets();
            realTimeDisplayConnected = displaySockets.length > 0;
          }
        }
              } catch (socketError) {
          // Socket status check failed, using database status
        }

      if (!activeGame) {
        // Get current game ID for the cashier when no active game
        const currentGameId = await GameIdService.getCurrentGameId(cashierId);
        
        // CRITICAL FIX: Also check display connection for the cashier's current session
        let fallbackDisplayConnected = false;
        try {
          const { io } = req.app.locals;
          if (io) {
            // Get cashier's current session from database
            const cashier = await Cashier.findById(cashierId);
            if (cashier?.sessionId) {
              const displaySockets = await io.in(`display:${cashier.sessionId}`).fetchSockets();
              fallbackDisplayConnected = displaySockets.length > 0;
            }
          }
        } catch (fallbackError) {
          // Fallback display status check failed
        }
        
        ResponseService.success(res, {
          id: formatGameIdForDisplay(currentGameId),
          gameId: currentGameId,
          status: 'waiting',
          currentNumber: null,
          calledNumbers: [],
          startTime: null,
          endTime: null,
          connectionStatus: {
            cashierConnected: realTimeCashierConnected,
            displayConnected: realTimeDisplayConnected || fallbackDisplayConnected
          }
        });
        return;
      }

      // TIMESTAMP VALIDATION: Ensure placedBetCartelas are from current game session
      const currentGameCreatedAt = activeGame.createdAt;
      const currentSessionId = activeGame.sessionId;
      
      // Filter placedBetCartelas to only include those from current game session
      const placedBetCartelas = activeGame.gameData?.placedBetCartelas || [];
      const currentTime = new Date();
      const timeDifferenceHours = Math.round((currentTime.getTime() - currentGameCreatedAt.getTime()) / (1000 * 60 * 60));
      
      // If game is older than 24 hours, clear placed bets (new day scenario)
      const isNewDay = timeDifferenceHours >= 24;
      const validatedPlacedBetCartelas = isNewDay ? [] : placedBetCartelas;
      
      if (isNewDay) {
        // Game is old (new day), clearing placed bets
      }

      const gameState = {
        id: formatGameIdForDisplay(activeGame.gameId),
        gameId: activeGame.gameId,
        status: activeGame.status,
        currentNumber: activeGame.gameData?.currentNumber || null,
        calledNumbers: activeGame.gameData?.calledNumbers || [],
        startTime: activeGame.gameData?.gameStartTime || null,
        endTime: activeGame.gameData?.gameEndTime || null,
        progress: activeGame.gameData?.progress || 0,
        cartelas: activeGame.gameData?.cartelas || 0,
        stack: activeGame.gameData?.stack || 0, // Add individual stake amount
        totalStack: activeGame.gameData?.totalStack || 0,
        totalWinStack: activeGame.gameData?.totalWinStack || 0,
        netShopProfit: activeGame.gameData?.netShopProfit || 0, // Add net shop profit
        placedBetCartelas: validatedPlacedBetCartelas, // Add validated placed bet cartelas
        gameCreatedAt: currentGameCreatedAt, // Add game creation timestamp for debugging

        connectionStatus: {
          cashierConnected: realTimeCashierConnected || activeGame.connectionStatus?.cashierConnected || false,
          displayConnected: realTimeDisplayConnected || activeGame.connectionStatus?.displayConnected || false
        }
      };

      ResponseService.success(res, gameState);

    } catch (error) {
      ResponseService.serverError(res, 'Failed to get current game');
    }
  };

export const startGame = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    const { eventId, selectedCartelas } = req.body;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // Get the current game ID from the cashier (which was set during endGame)
    const cashier = await Cashier.findById(cashierId);
    if (!cashier) {
      ResponseService.notFound(res, 'Cashier not found');
      return;
    }
    
    // Use the cashier's currentGameId (which should be the next sequential ID)
    const nextGameId = cashier.currentGameId || 4000;

    // Get the cashier's active game session
    const game = await Game.findOne({ 
      cashierId, 
      isConnected: true 
    }).sort({ lastActivity: -1 });

    if (!game) {
      ResponseService.notFound(res, 'No active game session found');
      return;
    }

    // NEW RULE: Check if at least 3 tickets have placed bets before starting the game
    const placedBetsCount = game.gameData?.placedBetCartelas?.length || 0;
    const hasEnoughPlacedBets = placedBetsCount >= 3;
    
    if (!hasEnoughPlacedBets) {
      console.log(`❌ Game start rejected: Only ${placedBetsCount} tickets with placed bets found for cashier ${cashierId}, need at least 3`);
      ResponseService.badRequest(res, `Cannot start game: At least 3 tickets must have placed bets (currently ${placedBetsCount})`);
      return;
    }
    
    console.log(`✅ Game start validation passed: Found ${placedBetsCount} tickets with placed bets (minimum 3 required)`);

    // Update game status to active and set the new game ID
    const updatedGame = await Game.findByIdAndUpdate(
      game._id,
      {
        $set: {
          gameId: generateGameId(nextGameId),
          status: 'active',
          'gameData.gameStartTime': new Date(),
          lastActivity: new Date()
        }
      },
      { new: true }
    );

    if (!updatedGame) {
      ResponseService.serverError(res, 'Failed to update game status');
      return;
    }

    const gameState = {
      id: formatGameIdForDisplay(updatedGame!.gameId),
      gameId: updatedGame!.gameId,
      status: updatedGame!.status,
      currentNumber: updatedGame!.gameData?.currentNumber || null,
      calledNumbers: updatedGame!.gameData?.calledNumbers || [],
      startTime: updatedGame!.gameData?.gameStartTime || null,
      endTime: updatedGame!.gameData?.gameEndTime || null,
      progress: updatedGame!.gameData?.progress || 0,
      cartelas: updatedGame!.gameData?.cartelas || 0,
      totalStack: updatedGame!.gameData?.totalStack || 0,
      totalWinStack: updatedGame!.gameData?.totalWinStack || 0
    };

    ResponseService.success(res, gameState, 'Game started successfully');

  } catch (error) {
    console.error('Error in startGame:', error);
    ResponseService.serverError(res, 'Failed to start game');
  }
};

export const pauseGame = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // Get the cashier's active game session
    const game = await Game.findOne({ 
      cashierId, 
      isConnected: true 
    }).sort({ lastActivity: -1 });

    if (!game) {
      ResponseService.notFound(res, 'No active game session found');
      return;
    }

    // Update game status to paused
    const updatedGame = await Game.findByIdAndUpdate(
      game._id,
      {
        status: 'paused',
        lastActivity: new Date()
      },
      { new: true }
    );

    if (!updatedGame) {
      ResponseService.serverError(res, 'Failed to update game status');
      return;
    }

    const gameState = {
      id: formatGameIdForDisplay(updatedGame!.gameId),
      status: updatedGame!.status,
      currentNumber: updatedGame!.gameData?.currentNumber || null,
      calledNumbers: updatedGame!.gameData?.calledNumbers || [],
      startTime: updatedGame!.gameData?.gameStartTime || null,
      endTime: updatedGame!.gameData?.gameEndTime || null,
      progress: updatedGame!.gameData?.progress || 0,
      cartelas: updatedGame!.gameData?.cartelas || 0,
      totalStack: updatedGame!.gameData?.totalStack || 0,
      totalWinStack: updatedGame!.gameData?.totalWinStack || 0
    };

    ResponseService.success(res, gameState, 'Game paused successfully');

  } catch (error) {
    console.error('Error in pauseGame:', error);
    ResponseService.serverError(res, 'Failed to pause game');
  }
};

export const resumeGame = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // Get the cashier's active game session
    const game = await Game.findOne({ 
      cashierId, 
      isConnected: true 
    }).sort({ lastActivity: -1 });

    if (!game) {
      ResponseService.notFound(res, 'No active game session found');
      return;
    }

    // Update game status to active
    const updatedGame = await Game.findByIdAndUpdate(
      game._id,
      {
        status: 'active',
        lastActivity: new Date()
      },
      { new: true }
    );

    if (!updatedGame) {
      ResponseService.serverError(res, 'Failed to update game status');
      return;
    }

    const gameState = {
      id: formatGameIdForDisplay(updatedGame!.gameId),
      status: updatedGame!.status,
      currentNumber: updatedGame!.gameData?.currentNumber || null,
      calledNumbers: updatedGame!.gameData?.calledNumbers || [],
      startTime: updatedGame!.gameData?.gameStartTime || null,
      endTime: updatedGame!.gameData?.gameEndTime || null,
      progress: updatedGame!.gameData?.progress || 0,
      cartelas: updatedGame!.gameData?.cartelas || 0,
      totalStack: updatedGame!.gameData?.totalStack || 0,
      totalWinStack: updatedGame!.gameData?.totalWinStack || 0
    };

    ResponseService.success(res, gameState, 'Game resumed successfully');

  } catch (error) {
    console.error('Error in resumeGame:', error);
    ResponseService.serverError(res, 'Failed to resume game');
  }
};

export const endGame = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // Get the cashier's active game session
    console.log(`🔍 Looking for active game for cashier: ${cashierId}`);
    
    let game = await Game.findOne({ 
      cashierId, 
      status: { $in: ['waiting', 'active', 'paused'] }
    }).sort({ lastActivity: -1 });

    // If no game found by cashierId, try to find by sessionId
    if (!game) {
      console.log('🔍 No game found by cashierId, trying to find by sessionId...');
      
      const cashier = await Cashier.findById(cashierId).select('sessionId');
      if (cashier?.sessionId) {
        game = await Game.findOne({ 
          sessionId: cashier.sessionId,
          status: { $in: ['waiting', 'active', 'paused'] }
        }).sort({ lastActivity: -1 });
        
        if (game) {
          console.log('🔍 Found game by sessionId:', game.gameId);
        }
      }
    }

    if (!game) {
      console.log('❌ No active game session found for cashier:', cashierId);
      ResponseService.notFound(res, 'No active game session found');
      return;
    }

    console.log(`🎮 Ending game ${game.gameId} for cashier ${cashierId}`);

    // Calculate next game ID
    let nextGameId: number;
    try {
      const currentGameId = parseInt(game.gameId, 10);
      nextGameId = currentGameId + 1;
      
      // Ensure we don't exceed maximum (4999) and reset to 4000
      if (nextGameId > 4999) {
        nextGameId = 4000;
      }
      
      console.log(`🎮 Current game ID: ${currentGameId}, Next game ID: ${nextGameId}`);
    } catch (error) {
      console.error('❌ Error parsing game ID:', error);
      nextGameId = 4000; // Fallback to start
    }

    // Update cashier's currentGameId
    await Cashier.findByIdAndUpdate(cashierId, {
      currentGameId: nextGameId,
      lastGameDate: new Date(),
      lastActivity: new Date()
    });

    // Archive the completed game using the aggregation service
    try {
      await GameAggregationService.moveGameToCompleted(game.sessionId, game.gameId);
      console.log(`📊 Game ${game.gameId} archived successfully with complete financial data`);
    } catch (archiveError) {
      console.error('❌ Error archiving game with GameAggregationService:', archiveError);
      
      // Fallback to old method if the new service fails
      const CompletedGame = (await import('../models/CompletedGame')).default;
      const completedGameData = {
        gameId: game.gameId,
        cashierId: game.cashierId,
        sessionId: game.sessionId,
        status: 'completed',
        gameData: {
          gameStartTime: game.gameData?.gameStartTime || null,
          gameEndTime: new Date(),
          finalProgress: game.gameData?.progress || 0,
          finalCalledNumbers: game.gameData?.calledNumbers || [],
          finalCurrentNumber: game.gameData?.currentNumber || null,
          finalCartelas: game.gameData?.cartelas || 0,
          finalTotalStack: game.gameData?.totalStack || 0,
          finalTotalWinStack: game.gameData?.totalWinStack || 0,
          finalTotalShopMargin: game.gameData?.totalShopMargin || 0,
          finalTotalSystemFee: game.gameData?.totalSystemFee || 0,
          finalNetPrizePool: game.gameData?.netPrizePool || 0,
          finalDrawHistory: game.gameData?.drawHistory || [],
          finalSelectedCartelas: game.gameData?.selectedCartelas || [],
          finalPlacedBetCartelas: game.gameData?.placedBetCartelas || [],
          finalWinPatterns: game.gameData?.winPatterns || [],
          completedAt: new Date()
        },
        connectionStatus: game.connectionStatus,
        createdAt: game.createdAt,
        completedAt: new Date()
      };
      
      await CompletedGame.create(completedGameData);
      console.log(`📊 Game ${game.gameId} archived with fallback method`);
    }

    // Delete the old game
    await Game.findByIdAndDelete(game._id);
    console.log(`🗑️ Old game ${game.gameId} removed from games collection`);

    // MARK ALL PENDING TICKETS AS LOST when game ends
    // This ensures all tickets have a final status (won/lost) for proper unclaimed calculation
    try {
      const Bet = (await import('../models/Bet')).default;
      const pendingTicketsResult = await Bet.updateMany(
        { 
          gameId: game.gameId, 
          cashierId: cashierId,
          betStatus: 'pending' // Only update pending tickets
        },
        { 
          betStatus: 'lost',
          settledAt: new Date(),
          win: 0, // Set win amount to 0 for lost tickets
          notes: 'Game ended - ticket automatically marked as lost'
        }
      );
      
      if (pendingTicketsResult.modifiedCount > 0) {
        console.log(`🎫 Marked ${pendingTicketsResult.modifiedCount} pending tickets as lost for ended game ${game.gameId}`);
      } else {
        console.log(`ℹ️ No pending tickets found to mark as lost for game ${game.gameId}`);
      }
    } catch (ticketUpdateError) {
      console.error('❌ Error updating pending tickets to lost status:', ticketUpdateError);
      // Don't fail the game end process if ticket update fails
    }

    // Create new game with clean state
    const newGameData = {
      gameId: nextGameId.toString(),
      cashierId: cashierId, // Always use the current cashierId from the request
      sessionId: game.sessionId,
      displayToken: game.displayToken,
      status: 'waiting',
      isConnected: true,
      connectedAt: new Date(),
      lastActivity: new Date(),
      gameData: {
        cartelas: 0,
        stack: 0,
        totalStack: 0,
        totalWinStack: 0,
        totalShopMargin: 0,
        totalSystemFee: 0,
        netPrizePool: 0,
        netShopProfit: 0,
        placedBetCartelas: [],
        selectedCartelas: [],
        progress: 0,
        calledNumbers: [],
        currentNumber: null,
        drawHistory: [],
        gameStartTime: null,
        gameEndTime: null,
        lastDrawTime: null,
        winPatterns: [],
        verifiedCartelas: [],
        verificationResults: {},
        hasWinners: false,
        winnerCount: 0,
        lastWinnerCheck: null
      },
      connectionStatus: {
        displayConnected: game.connectionStatus?.displayConnected || false,
        cashierConnected: true
      }
    };
    
    const newGame = await Game.create(newGameData);
    console.log(`🎮 New game ${nextGameId} created successfully`);
    console.log(`🎮 New game details:`, {
      gameId: newGame.gameId,
      cashierId: newGame.cashierId,
      sessionId: newGame.sessionId,
      status: newGame.status
    });

    const gameState = {
      gameId: nextGameId.toString(),
      status: 'waiting',
      message: 'New game ready',
      nextGameId: nextGameId.toString()
    };

    ResponseService.success(res, gameState, 'Game ended successfully');

    // Emit real-time updates to both cashier and display
    if (newGame.sessionId && req.app.locals.io) {
      const io = req.app.locals.io;
      const roomName = `game:${newGame.sessionId}`;
      const cashierRoomName = `cashier:${cashierId}`;
      const displayRoomName = `display:${newGame.sessionId}`;
      
      console.log(`🎮 Emitting game events to rooms: ${roomName}, ${cashierRoomName}, ${displayRoomName}`);
      
      // Emit to cashier room
      io.to(cashierRoomName).emit('game:ended', {
        gameId: game.gameId,
        status: 'waiting',
        timestamp: new Date(),
        message: 'Previous game ended successfully'
      });

      io.to(cashierRoomName).emit('game:new_ready', {
        gameId: newGame.gameId,
        status: 'waiting',
        message: 'New game ready to start'
      });

      io.to(cashierRoomName).emit('game:game_id_updated', {
        oldGameId: game.gameId,
        newGameId: newGame.gameId,
        timestamp: new Date(),
        message: 'Game ID updated for new game'
      });

      // Emit to display room
      io.to(displayRoomName).emit('game_ended', {
        gameId: newGame.gameId,
        status: 'waiting',
        timestamp: new Date()
      });

      io.to(displayRoomName).emit('game_comprehensive_reset', {
        newGameId: newGame.gameId,
        message: 'Game ended - new game ready',
        timestamp: new Date()
      });

      // Emit to game room
      io.to(roomName).emit('game_ended', {
        gameId: newGame.gameId,
        status: 'waiting',
        timestamp: new Date()
      });

      // Force refresh for all clients
      io.to(displayRoomName).emit('refresh_pages', {
        message: 'Game ended - refreshing for new game',
        timestamp: new Date()
      });

      io.to(cashierRoomName).emit('cashier:refresh_required', {
        reason: 'Game ended - new game ready',
        gameId: newGame.gameId,
        timestamp: new Date()
      });

      console.log(`✅ All game transition events emitted successfully`);
    }

  } catch (error) {
    console.error('❌ Error ending game:', error);
    ResponseService.serverError(res, 'Failed to end game');
  }
};

export const resetGame = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // Get the cashier's active game session
    const game = await Game.findOne({ 
      cashierId, 
      isConnected: true 
    }).sort({ lastActivity: -1 });

    if (!game) {
      ResponseService.notFound(res, 'No active game session found');
      return;
    }

    // Reset game to waiting state, clear game data, but keep the same game ID
    const updatedGame = await Game.findByIdAndUpdate(
      game._id,
      {
        $set: {
          // Keep the same gameId - don't change it
          status: 'waiting',
          'gameData.calledNumbers': [],
          'gameData.currentNumber': null,
          'gameData.progress': 0,
          'gameData.gameStartTime': null,
          'gameData.gameEndTime': null,
          'gameData.lastDrawTime': null,
          'gameData.drawHistory': [],
  
          lastActivity: new Date()
        }
      },
      { new: true }
    );

    if (!updatedGame) {
      ResponseService.serverError(res, 'Failed to reset game');
      return;
    }

    const gameState = {
      id: formatGameIdForDisplay(updatedGame!.gameId),
      gameId: updatedGame!.gameId,
      status: updatedGame!.status,
      currentNumber: updatedGame!.gameData?.currentNumber || null,
      calledNumbers: updatedGame!.gameData?.calledNumbers || [],
      startTime: updatedGame!.gameData?.gameStartTime || null,
      endTime: updatedGame!.gameData?.gameEndTime || null,
      progress: updatedGame!.gameData?.progress || 0,
      cartelas: updatedGame!.gameData?.cartelas || 0,
      totalStack: updatedGame!.gameData?.totalStack || 0,
      totalWinStack: updatedGame!.gameData?.totalWinStack || 0
    };

    ResponseService.success(res, gameState, 'Game reset successfully');

  } catch (error) {
    console.error('Error in resetGame:', error);
    ResponseService.serverError(res, 'Failed to reset game');
  }
}; 

// POST /api/cashiers/:id/refresh-session - Refresh cashier session
export const refreshCashierSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Generate new session ID
    const newSessionId = generateSessionId();
    const newDisplayUrl = generateDisplayUrl(newSessionId);
    
    // Update cashier with new session
    const updatedCashier = await Cashier.findByIdAndUpdate(
      id,
      {
        sessionId: newSessionId,
        displayUrl: newDisplayUrl,
        lastActivity: new Date()
      },
      { new: true }
    ).select('username sessionId displayUrl isConnected lastActivity');
    
    if (!updatedCashier) {
      ResponseService.notFound(res, 'cashier');
      return;
    }
    
    ResponseService.success(res, {
      success: true,
      message: 'Session refreshed successfully',
      data: updatedCashier
    });
    
    console.log(`🔄 Cashier ${updatedCashier.username} session refreshed: ${newSessionId}`);
  } catch (error) {
    console.error('Error refreshing cashier session:', error);
    ResponseService.serverError(res, 'Failed to refresh session');
  }
}; 

export const getNextGameInfo = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier not authenticated');
      return;
    }

    // Get information about the next game
    const nextGameInfo = await GameIdService.getNextGameInfo(cashierId);
    
    ResponseService.success(res, nextGameInfo, 'Next game information retrieved successfully');
  } catch (error) {
    console.error('❌ Error getting next game info:', error);
    ResponseService.serverError(res, 'Failed to get next game information');
  }
};

// GET /api/cashiers/placed-bet-cartelas - Get placed bet cartelas with timestamp validation
export const getPlacedBetCartelas = async (req: CashierRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.cashier?.id;
    
    console.log('🔍 getPlacedBetCartelas called with cashierId:', cashierId);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request cookies:', req.cookies);
    
    if (!cashierId) {
      console.log('❌ No cashierId found in request');
      ResponseService.unauthorized(res, 'Unauthorized access');
      return;
    }

    console.log('🔍 Looking for games with cashierId:', cashierId);
    
    // Get the current active game for this cashier
    // First try to find by cashierId and status
    let currentGame = await Game.findOne({ 
      cashierId,
      status: { $in: ['waiting', 'active', 'paused'] }
    }).sort({ createdAt: -1 }); // Get the most recent game

    // If no game found by cashierId, try to find by sessionId (fallback)
    if (!currentGame) {
      console.log('🔍 No game found by cashierId, trying to find by sessionId...');
      
      // Get the cashier to find their current sessionId
      const cashier = await Cashier.findById(cashierId).select('sessionId');
      if (cashier?.sessionId) {
        currentGame = await Game.findOne({ 
          sessionId: cashier.sessionId,
          status: { $in: ['waiting', 'active', 'paused'] }
        }).sort({ createdAt: -1 });
        
        if (currentGame) {
          console.log('🔍 Found game by sessionId:', currentGame.gameId);
        }
      }
    }

    // Debug: List all games for this cashier to see what's in the database
    if (!currentGame) {
      console.log('🔍 Debug: Listing all games for cashier:', cashierId);
      const allGames = await Game.find({ cashierId }).select('gameId status sessionId createdAt');
      console.log('🔍 All games found:', allGames);
      
      // Also check by sessionId
      const cashierForDebug = await Cashier.findById(cashierId).select('sessionId');
      if (cashierForDebug?.sessionId) {
        const gamesBySession = await Game.find({ sessionId: cashierForDebug.sessionId }).select('gameId status cashierId createdAt');
        console.log('🔍 Games by sessionId:', gamesBySession);
      }
    }

    console.log('🔍 Found game:', currentGame ? {
      gameId: currentGame.gameId,
      status: currentGame.status,
      cashierId: currentGame.cashierId,
      sessionId: currentGame.sessionId
    } : 'No game found');

    if (!currentGame) {
      // No active game found, return empty array
      console.log('⚠️ No active game found for cashier:', cashierId);
      ResponseService.success(res, [], 'No active game found');
      return;
    }

    // TIMESTAMP VALIDATION: Only return placed bets from the current game session
    // This prevents old bets from previous days/sessions from appearing
    const currentGameCreatedAt = currentGame.createdAt;
    const currentSessionId = currentGame.sessionId;
    
    console.log(`🔍 Fetching placed bet cartelas for game ${currentGame.gameId} (created: ${currentGameCreatedAt})`);
    console.log(`🔍 Session ID: ${currentSessionId}`);

    // Get placed bet cartelas from the current game's gameData
    const placedBetCartelas = currentGame.gameData?.placedBetCartelas || [];
    
    // Additional validation: Check if any bets exist and log for debugging
    if (placedBetCartelas.length > 0) {
      console.log(`✅ Found ${placedBetCartelas.length} placed bet cartelas in current game session`);
      console.log(`✅ Game session created: ${currentGameCreatedAt}`);
      console.log(`✅ Current time: ${new Date()}`);
      console.log(`✅ Time difference: ${Math.round((new Date().getTime() - currentGameCreatedAt.getTime()) / (1000 * 60 * 60))} hours`);
    } else {
      console.log(`ℹ️ No placed bet cartelas found in current game session`);
    }

    ResponseService.success(res, placedBetCartelas, 'Placed bet cartelas retrieved successfully');

  } catch (error) {
    console.error('❌ Error getting placed bet cartelas:', error);
    ResponseService.serverError(res, 'Failed to get placed bet cartelas');
  }
};