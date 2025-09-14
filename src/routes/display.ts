import express from 'express';
import { getCartelasForDisplay } from '../controllers/cartelaController';
import { getPlacedBetCartelasForDisplay } from '../controllers/betController';

const router = express.Router();

// Debug endpoint to test display routes
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Display routes are working',
    query: req.query,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Public route for display to fetch cartelas (no authentication required)
router.get('/cartelas', getCartelasForDisplay);

// Public route for display to fetch placed bet cartelas (no authentication required)
router.get('/placed-cartelas', getPlacedBetCartelasForDisplay);

// Public route to get display connection status (no authentication required)
router.get('/connection-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get the socket.io instance
    const { io } = req.app.locals;
    
    if (!io) {
      return res.status(500).json({ 
        success: false, 
        error: 'Socket.io not available' 
      });
    }
    
    // Check display room for active sockets
    const displaySockets = await io.in(`display:${sessionId}`).fetchSockets();
    const isDisplayConnected = displaySockets.length > 0;
    
    // Check game room for active sockets
    const gameSockets = await io.in(`game:${sessionId}`).fetchSockets();
    const isGameActive = gameSockets.length > 0;
    
    // Get database connection status
    const Game = (await import('../models/Game')).default;
    const game = await Game.findOne({ sessionId });
    const dbDisplayConnected = game?.connectionStatus?.displayConnected || false;
    
    res.json({
      success: true,
      data: {
        sessionId,
        displayConnected: isDisplayConnected,
        dbDisplayConnected,
        displaySocketsCount: displaySockets.length,
        gameSocketsCount: gameSockets.length,
        isGameActive,
        gameStatus: game?.status || 'unknown',
        lastActivity: game?.connectionStatus?.lastDisplayActivity || null,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error getting display connection status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get connection status' 
    });
  }
});

export default router;
