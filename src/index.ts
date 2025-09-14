import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Import configurations and routes
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import shopOwnersRoutes from './routes/shopOwners';
import shopOwnerAuthRoutes from './routes/shopOwnerAuth';
import shopsRoutes from './routes/shops';
import cashiersRoutes from './routes/cashiers';
import cashierAuthRoutes from './routes/cashierAuth';
import cashierDashboardRoutes from './routes/cashierDashboard';
import cashierRoutes from './routes/cashier';
import balanceRoutes from './routes/balance';
import usersRoutes from './routes/users';
import gameResultsRoutes from './routes/gameResults';
import winPatternsRoutes from './routes/winPatterns';
import cartelasRoutes from './routes/cartelas';
import betRoutes from './routes/bets';
import slipsRoutes from './routes/slips';
import displayRoutes from './routes/display';
import verificationRoutes from './routes/verificationRoutes';


// Import socket manager
import { SocketManager } from './socket/socketManager';

// Import socket handlers and services
import { setSocketHandler as setShopSocketHandler } from './controllers/shopController';
import { setSocketHandler as setShopOwnerSocketHandler } from './controllers/shopOwnerController';
import { performanceMonitor, memoryMonitor } from './middleware/performance';

// Import simple refresh service for event-driven updates
import RefreshService from './services/refreshService';

// Import Game ID Service for initialization
import { GameIdService } from './services/gameIdService';

// Load environment variables
dotenv.config();

/**
 * BINGO 2025 Server Application
 * 
 * Features:
 * - Real-time game management with Socket.IO
 * - Multi-role authentication (Admin, Cashier, Display)
 * - Performance monitoring and memory management
 * - Rate limiting and security middleware
 * - Clean, modular architecture
 */

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "https://admin-yebingo-com.netlify.app", "https://shop-admin-yebingo-com.netlify.app", "https://cashier-yebingo-com.netlify.app", "https://displayyebingocom.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "https://admin-yebingo-com.netlify.app", "https://shop-admin-yebingo-com.netlify.app", "https://cashier-yebingo-com.netlify.app", "https://displayyebingocom.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting configuration
const createRateLimiters = () => {
  const generalLimiter = rateLimit({
    windowMs: 50 * 60 * 1000, // 50 minutes
    max: 1000000, // limit each IP to 10000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100000, // limit each IP to 1000 requests per windowMs
    message: 'Too many authentication requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const displayLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Very permissive for display endpoints (public access)
    message: 'Too many display requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  return { generalLimiter, authLimiter, displayLimiter };
};

const { generalLimiter, authLimiter, displayLimiter } = createRateLimiters();

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/display', displayLimiter); // Apply display-specific rate limiting
app.use(generalLimiter); // Apply general rate limiting to other routes

// Development-specific rate limiting
if (process.env.NODE_ENV === 'development') {
  const devAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Very permissive for development
    message: 'Too many authentication requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/auth', devAuthLimiter);
  console.log('🔧 Development rate limiting enabled (5000 requests per 15 minutes)');
  console.log('🔧 Cashier authentication rate limiting: DISABLED (for frequent use)');
}

// Performance monitoring middleware
app.use(performanceMonitor);

// Connect to database
connectDatabase();

// Initialize global configuration
import { initializeGlobalConfig } from './utils/sessionUtils';
initializeGlobalConfig().then(() => {
  console.log('✅ Global configuration ready');
}).catch(error => {
  console.error('❌ Failed to initialize global config:', error);
});

// Initialize Game ID Service
GameIdService.initializeService().then(() => {
  console.log('✅ Game ID Service initialized');
}).catch(error => {
  console.error('❌ Failed to initialize Game ID Service:', error);
});

// Make io instance available to controllers
app.locals.io = io;

// API Routes
const setupRoutes = () => {
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/shop-owners', shopOwnersRoutes);
  app.use('/api/shop-owner-auth', shopOwnerAuthRoutes);
  app.use('/api/shops', shopsRoutes);
  app.use('/api/cashiers', cashiersRoutes);
  app.use('/api/cashier-auth', cashierAuthRoutes);
  app.use('/api/cashier-dashboard', cashierDashboardRoutes);
  app.use('/api/cashier', cashierRoutes);
  app.use('/api/balance', balanceRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/game-results', gameResultsRoutes);
  app.use('/api/win-patterns', winPatternsRoutes);
  app.use('/api/cartelas', cartelasRoutes);
  app.use('/api/bets', betRoutes);
  app.use('/api/slips', slipsRoutes);
  app.use('/api/display', displayRoutes);
  app.use('/api/verification', verificationRoutes);
};

setupRoutes();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Initialize socket manager
const socketManager = new SocketManager(io);

// Initialize simple refresh service for event-driven updates
const refreshService = new RefreshService(io);

// Set socket handlers for controllers that need them
setShopSocketHandler(io);
setShopOwnerSocketHandler(io);

// Memory monitoring
setInterval(memoryMonitor, 60000); // Check memory every minute

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('✅ Connected to MongoDB');
  console.log(`🚀 BINGO 2025 Server running on port ${PORT}`);
  console.log('📡 Socket.IO server ready for connections');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔒 Security: Helmet enabled');
  console.log('⏱️ Rate limiting: Enabled');
  console.log('📊 Admin real-time updates: Enabled');
  console.log('🎮 Game service: Initialized');
  console.log('💾 Memory monitoring: Active');
  console.log('🧹 Clean architecture: Modular socket handlers');
}); 
