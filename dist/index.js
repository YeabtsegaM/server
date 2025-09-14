"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Import configurations and routes
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const shopOwners_1 = __importDefault(require("./routes/shopOwners"));
const shopOwnerAuth_1 = __importDefault(require("./routes/shopOwnerAuth"));
const shops_1 = __importDefault(require("./routes/shops"));
const cashiers_1 = __importDefault(require("./routes/cashiers"));
const cashierAuth_1 = __importDefault(require("./routes/cashierAuth"));
const cashierDashboard_1 = __importDefault(require("./routes/cashierDashboard"));
const cashier_1 = __importDefault(require("./routes/cashier"));
const balance_1 = __importDefault(require("./routes/balance"));
const users_1 = __importDefault(require("./routes/users"));
const gameResults_1 = __importDefault(require("./routes/gameResults"));
const winPatterns_1 = __importDefault(require("./routes/winPatterns"));
const cartelas_1 = __importDefault(require("./routes/cartelas"));
const bets_1 = __importDefault(require("./routes/bets"));
const slips_1 = __importDefault(require("./routes/slips"));
const display_1 = __importDefault(require("./routes/display"));
const verificationRoutes_1 = __importDefault(require("./routes/verificationRoutes"));
// Import socket manager
const socketManager_1 = require("./socket/socketManager");
// Import socket handlers and services
const shopController_1 = require("./controllers/shopController");
const shopOwnerController_1 = require("./controllers/shopOwnerController");
const performance_1 = require("./middleware/performance");
// Import simple refresh service for event-driven updates
const refreshService_1 = __importDefault(require("./services/refreshService"));
// Import Game ID Service for initialization
const gameIdService_1 = require("./services/gameIdService");
// Load environment variables
dotenv_1.default.config();
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
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Configure Socket.IO with CORS
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});
// Security and performance middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// CORS configuration
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Rate limiting configuration
const createRateLimiters = () => {
    const generalLimiter = (0, express_rate_limit_1.default)({
        windowMs: 50 * 60 * 1000, // 50 minutes
        max: 1000000, // limit each IP to 10000 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    const authLimiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100000, // limit each IP to 1000 requests per windowMs
        message: 'Too many authentication requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    const displayLimiter = (0, express_rate_limit_1.default)({
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
    const devAuthLimiter = (0, express_rate_limit_1.default)({
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
app.use(performance_1.performanceMonitor);
// Connect to database
(0, database_1.connectDatabase)();
// Initialize global configuration
const sessionUtils_1 = require("./utils/sessionUtils");
(0, sessionUtils_1.initializeGlobalConfig)().then(() => {
    console.log('✅ Global configuration ready');
}).catch(error => {
    console.error('❌ Failed to initialize global config:', error);
});
// Initialize Game ID Service
gameIdService_1.GameIdService.initializeService().then(() => {
    console.log('✅ Game ID Service initialized');
}).catch(error => {
    console.error('❌ Failed to initialize Game ID Service:', error);
});
// Make io instance available to controllers
app.locals.io = io;
// API Routes
const setupRoutes = () => {
    app.use('/api/auth', auth_1.default);
    app.use('/api/dashboard', dashboard_1.default);
    app.use('/api/shop-owners', shopOwners_1.default);
    app.use('/api/shop-owner-auth', shopOwnerAuth_1.default);
    app.use('/api/shops', shops_1.default);
    app.use('/api/cashiers', cashiers_1.default);
    app.use('/api/cashier-auth', cashierAuth_1.default);
    app.use('/api/cashier-dashboard', cashierDashboard_1.default);
    app.use('/api/cashier', cashier_1.default);
    app.use('/api/balance', balance_1.default);
    app.use('/api/users', users_1.default);
    app.use('/api/game-results', gameResults_1.default);
    app.use('/api/win-patterns', winPatterns_1.default);
    app.use('/api/cartelas', cartelas_1.default);
    app.use('/api/bets', bets_1.default);
    app.use('/api/slips', slips_1.default);
    app.use('/api/display', display_1.default);
    app.use('/api/verification', verificationRoutes_1.default);
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
const socketManager = new socketManager_1.SocketManager(io);
// Initialize simple refresh service for event-driven updates
const refreshService = new refreshService_1.default(io);
// Set socket handlers for controllers that need them
(0, shopController_1.setSocketHandler)(io);
(0, shopOwnerController_1.setSocketHandler)(io);
// Memory monitoring
setInterval(performance_1.memoryMonitor, 60000); // Check memory every minute
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
//# sourceMappingURL=index.js.map