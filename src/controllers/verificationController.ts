import { Request, Response } from 'express';
import Bet from '../models/Bet';
import { Cartela } from '../models/Cartela';
import Game from '../models/Game';
import { ResponseService } from '../services/responseService';
import { WinPatternService, PatternMatchResult } from '../services/winPatternService';
import { GameAggregationService } from '../services/gameAggregationService';
import mongoose from 'mongoose';

interface VerificationRequest extends Request {
  cashier?: {
    id: string;
    username: string;
    role: string;
    shopId: string;
  };
}

/**
 * Verify a specific cartela for win/lost status
 * High-performance 1-to-1 verification in real-time
 */
export const verifyCartela = async (req: VerificationRequest, res: Response): Promise<void> => {
  try {
    const { cartelaId, gameId } = req.body;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!cartelaId || !gameId) {
      ResponseService.validationError(res, 'Cartela ID and Game ID are required');
      return;
    }

    console.log(`🔍 Verifying cartela ${cartelaId} for game ${gameId} by cashier ${cashierId}`);

    // Get current game with drawn numbers (real-time data)
    const game = await Game.findOne({ 
      gameId, 
      cashierId,
      status: { $in: ['active', 'paused'] } // Only active/paused games can be verified
    });

    console.log(`🔍 Game lookup for game ${gameId} by cashier ${cashierId}:`, {
      found: !!game,
      gameStatus: game?.status,
      gameId: game?.gameId,
      cashierId: game?.cashierId
    });

    if (!game) {
      ResponseService.notFound(res, 'Active game not found');
      return;
    }

    // Get cartela details (real-time lookup)
    const cartela = await Cartela.findOne({ 
      cartelaId, 
      cashierId,
      isActive: true 
    });

    console.log(`🔍 Cartela lookup for cartela ${cartelaId} by cashier ${cashierId}:`, {
      found: !!cartela,
      cartelaId: cartela?.cartelaId,
      isActive: cartela?.isActive,
      cashierId: cartela?.cashierId
    });

    if (!cartela) {
      ResponseService.notFound(res, 'Cartela not found or inactive');
      return;
    }

    // Check if cartela has bets in this game (include all statuses to check for already verified)
    const bet = await Bet.findOne({ 
      gameId, 
      cartelaId
      // Remove betStatus filter to find any bet for this cartela in this game
    });

    console.log(`🔍 Bet lookup for cartela ${cartelaId} in game ${gameId}:`, {
      found: !!bet,
      betStatus: bet?.betStatus,
      isVerified: bet?.isVerified,
      betId: bet?._id
    });

    if (!bet) {
      ResponseService.validationError(res, 'No bet found for this cartela in the current game');
      return;
    }

    // Check if cartela has already been verified for this game
    if (bet.isVerified) {
      console.log(`🔒 Cartela ${cartelaId} is already verified. Checking for existing verification results...`);
      
      // Check if verification is manually locked
      if (bet.verificationLocked) {
        console.log(`🔒 Cartela ${cartelaId} verification is manually locked and cannot be re-verified`);
        
        // Get the existing verification result to show locked status
        const verificationResults = game.gameData?.verificationResults ? 
          JSON.parse(JSON.stringify(game.gameData.verificationResults)) : {};
        
        const existingVerification = verificationResults[cartelaId] || 
                                     verificationResults[cartelaId.toString()];
        
        if (existingVerification) {
          const verificationData = {
            cartelaId,
            ticketNumber: bet.ticketNumber || `TKT_${cartelaId}`,
            gameId,
            status: 'locked', // Show locked status
            cartelaGrid: cartela.pattern,
            matchedNumbers: existingVerification.matchedNumbers || [],
            drawnNumbers: existingVerification.drawnNumbers || [],
            winningPatternDetails: existingVerification.status === 'won' ? [{
              patternName: existingVerification.patternNames?.join(', ') || 'Unknown Pattern',
              pattern: existingVerification.allMatchedPatterns || [],
              matchedPositions: []
            }] : [],
            gameProgress: game.gameData?.progress || 0,
            totalCalledNumbers: existingVerification.drawnNumbers?.length || 0,
            isLocked: true, // Show as locked
            originalStatus: existingVerification.status,
            canBeLocked: false, // Cannot be locked again
            lockedAt: bet.verificationLockedAt,
            lockedBy: bet.verificationLockedBy
          };

          // Emit locked verification result to display
          const io = req.app.locals.io;
          if (io && game.sessionId) {
            io.to(`display:${game.sessionId}`).emit('cartela_verified', verificationData);
            io.to(`cashier:${cashierId}`).emit('cartela_verified', verificationData);
          }

          ResponseService.success(res, {
            cartelaId,
            gameId,
            status: 'locked',
            message: `Cartela verification is manually locked and cannot be re-verified`,
            originalStatus: existingVerification.status,
            patterns: existingVerification.patterns || [],
            patternNames: existingVerification.patternNames || [],
            matchedNumbers: existingVerification.matchedNumbers || [],
            verifiedAt: existingVerification.verifiedAt,
            verifiedBy: existingVerification.verifiedBy,
            drawnNumbers: existingVerification.drawnNumbers || [],
            totalDrawn: existingVerification.drawnNumbers?.length || 0,
            isLocked: true,
            canBeLocked: false,
            lockedAt: bet.verificationLockedAt,
            lockedBy: bet.verificationLockedBy
          }, 'Cartela verification is locked - cannot be re-verified');
          return;
        }
      }
      
      // Convert to plain object to avoid Mongoose document issues
      const verificationResults = game.gameData?.verificationResults ? 
        JSON.parse(JSON.stringify(game.gameData.verificationResults)) : {};
      
      console.log(`🔍 Available verification result keys:`, Object.keys(verificationResults));
      console.log(`🔍 Full verification results:`, verificationResults);
      
      // Get the existing verification result to show current status
      // Handle both string and number keys for cartelaId
      const existingVerification = verificationResults[cartelaId] || 
                                   verificationResults[cartelaId.toString()];
      
      console.log(`🔍 Existing verification lookup:`, {
        cartelaId,
        cartelaIdString: cartelaId.toString(),
        found: !!existingVerification,
        verificationData: existingVerification
      });
      
      if (existingVerification) {
        // Allow re-verification by showing current status but not locking
        const verificationData = {
          cartelaId,
          ticketNumber: bet.ticketNumber || `TKT_${cartelaId}`,
          gameId,
          status: existingVerification.status, // Show actual status, not locked
          cartelaGrid: cartela.pattern,
          matchedNumbers: existingVerification.matchedNumbers || [],
          drawnNumbers: existingVerification.drawnNumbers || [],
          winningPatternDetails: existingVerification.status === 'won' ? [{
            patternName: existingVerification.patternNames?.join(', ') || 'Unknown Pattern',
            pattern: existingVerification.allMatchedPatterns || [],
            matchedPositions: []
          }] : [],
          gameProgress: game.gameData?.progress || 0,
          totalCalledNumbers: existingVerification.drawnNumbers?.length || 0,
          isLocked: false, // Never auto-lock
          originalStatus: existingVerification.status,
          canBeLocked: true // Allow manual locking
        };

        // Emit verification result to display (not locked)
        const io = req.app.locals.io;
        if (io && game.sessionId) {
          io.to(`display:${game.sessionId}`).emit('cartela_verified', verificationData);
          io.to(`cashier:${cashierId}`).emit('cartela_verified', verificationData);
        }

        ResponseService.success(res, {
          cartelaId,
          gameId,
          status: existingVerification.status,
          message: `Cartela already verified - Status: ${existingVerification.status}`,
          originalStatus: existingVerification.status,
          patterns: existingVerification.patterns || [],
          patternNames: existingVerification.patternNames || [],
          matchedNumbers: existingVerification.matchedNumbers || [],
          verifiedAt: existingVerification.verifiedAt,
          verifiedBy: existingVerification.verifiedBy,
          drawnNumbers: existingVerification.drawnNumbers || [],
          totalDrawn: existingVerification.drawnNumbers?.length || 0,
          canBeLocked: true // Allow manual locking
        }, 'Cartela already verified - showing current status');
        return;
      }
    }

    // Check if bet is in a verifiable state (pending or active)
    console.log(`🔍 Bet status check:`, {
      cartelaId,
      betStatus: bet.betStatus,
      isVerifiable: ['pending', 'active'].includes(bet.betStatus)
    });
    
    if (!['pending', 'active'].includes(bet.betStatus)) {
      ResponseService.validationError(res, `Cartela has ${bet.betStatus} status and cannot be verified again`);
      return;
    }

    // Get drawn numbers from game (real-time data)
    const drawnNumbers = game.gameData?.calledNumbers || [];
    
    if (drawnNumbers.length === 0) {
      ResponseService.validationError(res, 'No numbers have been drawn yet');
      return;
    }

    // High-performance 1-to-1 pattern matching (real-time)
    const matchResult = await WinPatternService.checkCartelaWin(
      cartela,
      drawnNumbers,
      cashierId
    );

    // Update bet status based on verification result
    let newBetStatus: string;
    let verificationMessage: string;

    if (matchResult.isWinner) {
      newBetStatus = 'won';
      // Show all matching patterns
      const patternNames = matchResult.patternNames.join(', ');
      verificationMessage = `🎉 WINNER! Patterns: ${patternNames}`;
      
      // Update game with winner information - now stores all matching patterns
      await Game.findOneAndUpdate(
        { _id: game._id },
        {
          $addToSet: {
            'gameData.verifiedCartelas': cartelaId
          },
          $set: {
            [`gameData.verificationResults.${cartelaId}`]: {
              status: 'won',
              patterns: matchResult.matchedPatterns, // Store all pattern IDs
              patternNames: matchResult.patternNames, // Store all pattern names
              allMatchedPatterns: matchResult.allMatchedPatterns, // Store detailed pattern info
              matchedNumbers: matchResult.matchedNumbers,
              verifiedAt: new Date(),
              verifiedBy: cashierId,
              drawnNumbers: drawnNumbers // Store drawn numbers at verification time
            }
          }
        }
      );

    } else {
      newBetStatus = 'lost';
      verificationMessage = `❌ No winning pattern matched`;
      
      // Update game with lost verification
      await Game.findOneAndUpdate(
        { _id: game._id },
        {
          $addToSet: {
            'gameData.verifiedCartelas': cartelaId
          },
          $set: {
            [`gameData.verificationResults.${cartelaId}`]: {
              status: 'lost',
              patterns: [],
              patternNames: [],
              allMatchedPatterns: [],
              matchedNumbers: [],
              verifiedAt: new Date(),
              verifiedBy: cashierId,
              drawnNumbers: drawnNumbers // Store drawn numbers at verification time
            }
          }
        }
      );
    }

    // Update bet status
    await Bet.findOneAndUpdate(
      { _id: bet._id },
      {
        betStatus: newBetStatus,
        isVerified: true,
        verifiedBy: cashierId,
        verifiedAt: new Date()
      }
    );

    // CRITICAL FIX: Update game with latest aggregated data after verification
    try {
      console.log(`💰 Updating game ${gameId} with latest aggregated data after verification...`);
      await GameAggregationService.updateGameWithAggregatedData(game.sessionId, gameId);
      console.log(`✅ Game ${gameId} updated with latest financial data after verification`);
    } catch (aggregationError) {
      console.error('❌ Error updating game data after verification:', aggregationError);
      // Don't fail the verification if aggregation fails
    }

    // Emit real-time update via WebSocket
    const io = req.app.locals.io;
    if (io && game.sessionId) {
      // Prepare complete verification data for display
      const verificationData = {
        cartelaId,
        ticketNumber: bet.ticketNumber || `TKT_${cartelaId}`,
        gameId,
        status: newBetStatus,
        cartelaGrid: cartela.pattern,
        matchedNumbers: matchResult.matchedNumbers,
        drawnNumbers: drawnNumbers, // Add drawn numbers for proper color coding
        winningPatternDetails: matchResult.isWinner ? [{
          patternName: matchResult.patternNames.join(', '), // Use all pattern names
          pattern: matchResult.allMatchedPatterns, // Use all matched patterns
          matchedPositions: [] // Will be populated if needed
        }] : [],
        gameProgress: game.gameData?.progress || 0,
        totalCalledNumbers: drawnNumbers.length,
        isLocked: false,
        originalStatus: undefined
      };

      // Emit verification result to display
      io.to(`display:${game.sessionId}`).emit('cartela_verified', verificationData);

      // Emit to cashier for real-time updates
      io.to(`cashier:${cashierId}`).emit('cartela_verified', verificationData);

      console.log(`📡 Verification result emitted for cartela ${cartelaId}: ${newBetStatus}`);
    }

    console.log(`✅ Cartela ${cartelaId} verified: ${newBetStatus}`);

    ResponseService.success(res, {
      cartelaId,
      gameId,
      status: newBetStatus,
      patterns: matchResult.matchedPatterns, // Use all pattern IDs
      patternNames: matchResult.patternNames, // Use all pattern names
      matchedNumbers: matchResult.matchedNumbers,
      message: verificationMessage,
      verifiedAt: new Date(),
      drawnNumbers: drawnNumbers,
      totalDrawn: drawnNumbers.length
    }, 'Cartela verification completed successfully');

  } catch (error) {
    console.error('Error in verifyCartela:', error);
    ResponseService.serverError(res, 'Failed to verify cartela');
  }
};

/**
 * Get verification status for all cartelas in a game
 * High-performance endpoint for bulk verification status
 */
export const getGameVerificationStatus = async (req: VerificationRequest, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!gameId) {
      ResponseService.validationError(res, 'Game ID is required');
      return;
    }

    console.log(`🔍 Getting verification status for game ${gameId}`);

    // Get game with verification results
    const game = await Game.findOne({ 
      gameId, 
      cashierId 
    }).select('gameData.verificationResults gameData.placedBetCartelas gameData.calledNumbers');

    if (!game) {
      ResponseService.notFound(res, 'Game not found');
      return;
    }

    // Get all bets for this game with verification status
    const bets = await Bet.find({ 
      gameId, 
      cashierId 
    }).select('cartelaId betStatus isVerified verifiedAt verifiedBy');

    // Build verification status map
    const verificationStatus = new Map();
    
    for (const bet of bets) {
      const cartelaId = bet.cartelaId;
      const gameVerification = game.gameData?.verificationResults?.[cartelaId];
      
      verificationStatus.set(cartelaId, {
        cartelaId,
        betStatus: bet.betStatus,
        isVerified: bet.isVerified,
        verifiedAt: bet.verifiedAt,
        verifiedBy: bet.verifiedBy,
        gameVerification: gameVerification || null
      });
    }

    ResponseService.success(res, {
      gameId,
      verificationStatus: Array.from(verificationStatus.values()),
      totalCartelas: bets.length,
      verifiedCount: bets.filter(b => b.isVerified).length,
      pendingCount: bets.filter(b => !b.isVerified).length,
      totalDrawnNumbers: game.gameData?.calledNumbers?.length || 0
    }, 'Game verification status retrieved successfully');

  } catch (error) {
    console.error('Error in getGameVerificationStatus:', error);
    ResponseService.serverError(res, 'Failed to get game verification status');
  }
};

/**
 * Batch verify multiple cartelas for performance
 * High-performance endpoint for multiple verifications
 */
export const batchVerifyCartelas = async (req: VerificationRequest, res: Response): Promise<void> => {
  try {
    const { cartelaIds, gameId } = req.body;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!cartelaIds || !Array.isArray(cartelaIds) || cartelaIds.length === 0 || !gameId) {
      ResponseService.validationError(res, 'Cartela IDs array and Game ID are required');
      return;
    }

    console.log(`🔍 Batch verifying ${cartelaIds.length} cartelas for game ${gameId}`);

    // Get current game (real-time data)
    const game = await Game.findOne({ 
      gameId, 
      cashierId,
      status: { $in: ['active', 'paused'] }
    });

    if (!game) {
      ResponseService.notFound(res, 'Active game not found');
      return;
    }

    // Get all cartelas and bets for batch processing (real-time lookup)
    const [cartelas, bets] = await Promise.all([
      Cartela.find({ 
        cartelaId: { $in: cartelaIds }, 
        cashierId,
        isActive: true 
      }),
      Bet.find({ 
        gameId, 
        cartelaId: { $in: cartelaIds }
        // Remove betStatus filter to find all bets for verification check
      })
    ]);

    if (cartelas.length === 0) {
      ResponseService.notFound(res, 'No valid cartelas found');
      return;
    }

    const drawnNumbers = game.gameData?.calledNumbers || [];
    if (drawnNumbers.length === 0) {
      ResponseService.validationError(res, 'No numbers have been drawn yet');
      return;
    }

    // High-performance batch pattern matching (real-time)
    const matchResults = await WinPatternService.checkMultipleCartelas(
      cartelas,
      drawnNumbers,
      cashierId
    );

    // Process verification results
    const verificationResults = [];
    const updates = [];

    for (const cartela of cartelas) {
      const cartelaId = cartela.cartelaId;
      const bet = bets.find(b => b.cartelaId === cartelaId);

      if (!bet) continue;

      // Check if cartela has already been verified
      if (bet.isVerified) {
        // Get existing verification result
        // Convert to plain object to avoid Mongoose document issues
        const verificationResults = game.gameData?.verificationResults ? 
          JSON.parse(JSON.stringify(game.gameData.verificationResults)) : {};
        
        // Handle both string and number keys for cartelaId
        const existingVerification = verificationResults[cartelaId] || 
                                     verificationResults[cartelaId.toString()];
        if (existingVerification) {
          verificationResults.push({
            cartelaId,
            status: 'locked',
            patterns: existingVerification.patterns || [],
            patternNames: existingVerification.patternNames || [],
            allMatchedPatterns: existingVerification.allMatchedPatterns || [],
            matchedNumbers: existingVerification.matchedNumbers || [],
            verifiedAt: existingVerification.verifiedAt,
            verifiedBy: existingVerification.verifiedBy,
            drawnNumbers: existingVerification.drawnNumbers || []
          });
          continue; // Skip to next cartela
        }
      }

      // Process new verification
      const matchResult = matchResults.get(cartelaId.toString());
      if (matchResult) {
        // Update bet status
        bet.betStatus = matchResult.isWinner ? 'won' : 'lost';
        bet.isVerified = true;
        bet.verifiedAt = new Date();
        bet.verifiedBy = new mongoose.Types.ObjectId(cashierId);
        await bet.save();

        // Add to verification results
        verificationResults.push({
          cartelaId,
          status: matchResult.isWinner ? 'won' : 'lost',
          patterns: matchResult.matchedPatterns || [],
          patternNames: matchResult.patternNames || [],
          allMatchedPatterns: matchResult.allMatchedPatterns || [],
          matchedNumbers: matchResult.matchedNumbers || [],
          verifiedAt: new Date(),
          verifiedBy: new mongoose.Types.ObjectId(cashierId),
          drawnNumbers: drawnNumbers
        });

        // Prepare game update
        updates.push({
          [`gameData.verificationResults.${cartelaId}`]: {
            status: matchResult.isWinner ? 'won' : 'lost',
            patterns: matchResult.matchedPatterns || [],
            patternNames: matchResult.patternNames || [],
            allMatchedPatterns: matchResult.allMatchedPatterns || [],
            matchedNumbers: matchResult.matchedNumbers || [],
            verifiedAt: new Date(),
            verifiedBy: new mongoose.Types.ObjectId(cashierId),
            drawnNumbers: drawnNumbers
          }
        });
      }
    }

    // Update game with all verification results
    if (updates.length > 0) {
      await Game.findByIdAndUpdate(game._id, {
        $set: Object.assign({}, ...updates)
      });
    }

    console.log(`✅ Batch verification completed for ${verificationResults.length} cartelas`);

    ResponseService.success(res, {
      gameId,
      verifiedCount: verificationResults.length,
      results: verificationResults,
      drawnNumbers: drawnNumbers,
      totalDrawn: drawnNumbers.length
    }, 'Batch verification completed successfully');

  } catch (error) {
    console.error('Error in batchVerifyCartelas:', error);
    ResponseService.serverError(res, 'Failed to batch verify cartelas');
  }
};

/**
 * Manually lock verification for a cartela (cashier-controlled)
 */
export const lockVerification = async (req: VerificationRequest, res: Response): Promise<void> => {
  try {
    const { cartelaId, gameId } = req.body;
    const cashierId = req.cashier?.id;

    if (!cashierId) {
      ResponseService.unauthorized(res, 'Cashier authentication required');
      return;
    }

    if (!cartelaId || !gameId) {
      ResponseService.validationError(res, 'Cartela ID and Game ID are required');
      return;
    }

    console.log(`🔒 Manually locking verification for cartela ${cartelaId} in game ${gameId} by cashier ${cashierId}`);

    // Get current game
    const game = await Game.findOne({ 
      gameId, 
      cashierId,
      status: { $in: ['active', 'paused', 'completed'] } // Allow locking for completed games too
    });

    if (!game) {
      ResponseService.notFound(res, 'Game not found');
      return;
    }

    // Get cartela details
    const cartela = await Cartela.findOne({ 
      cartelaId, 
      cashierId,
      isActive: true 
    });

    if (!cartela) {
      ResponseService.notFound(res, 'Cartela not found or inactive');
      return;
    }

    // Get bet for this cartela in this game
    const bet = await Bet.findOne({ 
      gameId, 
      cartelaId
    });

    if (!bet) {
      ResponseService.validationError(res, 'No bet found for this cartela in the current game');
      return;
    }

    // Check if cartela has been verified
    if (!bet.isVerified) {
      ResponseService.validationError(res, 'Cartela must be verified before it can be locked');
      return;
    }

    // Get verification results
    const verificationResults = game.gameData?.verificationResults ? 
      JSON.parse(JSON.stringify(game.gameData.verificationResults)) : {};
    
    const existingVerification = verificationResults[cartelaId] || 
                                 verificationResults[cartelaId.toString()];

    if (!existingVerification) {
      ResponseService.validationError(res, 'No verification results found for this cartela');
      return;
    }

    // Mark verification as locked
    bet.isVerified = true; // Ensure it stays verified
    bet.verificationLocked = true; // Add new field for manual lock
    bet.verificationLockedAt = new Date();
    bet.verificationLockedBy = new mongoose.Types.ObjectId(cashierId);
    await bet.save();

    // Update game verification results to mark as locked
    const updateData: any = {};
    updateData[`gameData.verificationResults.${cartelaId}.isLocked`] = true;
    updateData[`gameData.verificationResults.${cartelaId}.lockedAt`] = new Date();
    updateData[`gameData.verificationResults.${cartelaId}.lockedBy`] = new mongoose.Types.ObjectId(cashierId);

    await Game.findByIdAndUpdate(game._id, {
      $set: updateData
    });

    // Prepare locked verification data for display
    const verificationData = {
      cartelaId,
      ticketNumber: bet.ticketNumber || `TKT_${cartelaId}`,
      gameId,
      status: 'locked',
      cartelaGrid: cartela.pattern,
      matchedNumbers: existingVerification.matchedNumbers || [],
      drawnNumbers: existingVerification.drawnNumbers || [],
      winningPatternDetails: existingVerification.status === 'won' ? [{
        patternName: existingVerification.patternNames?.join(', ') || 'Unknown Pattern',
        pattern: existingVerification.allMatchedPatterns || [],
        matchedPositions: []
      }] : [],
      gameProgress: game.gameData?.progress || 0,
      totalCalledNumbers: existingVerification.drawnNumbers?.length || 0,
      isLocked: true,
      originalStatus: existingVerification.status,
      lockedAt: new Date(),
      lockedBy: new mongoose.Types.ObjectId(cashierId)
    };

    // Emit locked verification result to display
    const io = req.app.locals.io;
    if (io && game.sessionId) {
      io.to(`display:${game.sessionId}`).emit('cartela_verified', verificationData);
      io.to(`cashier:${cashierId}`).emit('cartela_verified', verificationData);
    }

    ResponseService.success(res, {
      cartelaId,
      gameId,
      status: 'locked',
      message: '🔒 Verification manually locked by cashier',
      originalStatus: existingVerification.status,
      patterns: existingVerification.patterns || [],
      patternNames: existingVerification.patternNames || [],
      matchedNumbers: existingVerification.matchedNumbers || [],
      verifiedAt: existingVerification.verifiedAt,
      verifiedBy: existingVerification.verifiedBy,
      drawnNumbers: existingVerification.drawnNumbers || [],
      totalDrawn: existingVerification.drawnNumbers?.length || 0,
      lockedAt: new Date(),
      lockedBy: new mongoose.Types.ObjectId(cashierId)
    }, 'Verification manually locked successfully');

  } catch (error) {
    console.error('Error in lockVerification:', error);
    ResponseService.serverError(res, 'Failed to lock verification');
  }
};
