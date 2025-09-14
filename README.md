# BINGO 2025 Server

A secure, well-organized Node.js server for the BINGO 2025 application with real-time authentication and game management.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- 🛡️ **Security**: Helmet middleware, rate limiting, CORS protection
- 📊 **Real-time**: Socket.IO for real-time game updates
- 🗄️ **Database**: MongoDB with Mongoose ODM
- 🏗️ **Clean Architecture**: Separated routes, controllers, and middleware
- 🔄 **TypeScript**: Full TypeScript support

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.ts          # Database configuration
│   ├── controllers/
│   │   └── authController.ts     # Authentication logic
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication middleware
│   ├── models/
│   │   └── Admin.ts             # Admin user model
│   ├── routes/
│   │   ├── auth.ts              # Authentication routes
│   │   ├── dashboard.ts         # Dashboard routes
│   │   └── games.ts             # Game management routes
│   ├── index.ts                 # Main server file
│   └── seed.ts                  # Database seeding script
```

## Setup

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the server root:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/bingo2025
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

3. **Database Setup:**
   ```bash
   # Start MongoDB (if local)
   mongod
   
   # Seed the database with admin user
   npm run seed
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout (protected)
- `GET /api/auth/verify` - Verify JWT token

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (protected)
- `GET /api/dashboard/activity` - Get recent activity (protected)

### Games
- `GET /api/games` - Get all games (protected)
- `POST /api/games` - Create new game (protected)
- `PUT /api/games/:id` - Update game (protected)
- `DELETE /api/games/:id` - Delete game (protected)

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/status` - Server status

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers and CSP
- **CORS**: Configured for development and production
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Proper error responses without exposing internals

## Default Admin Credentials

After running the seed script:
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Important:** Change these credentials in production!

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run seed` - Seed database with admin user

### Socket.IO Events

The server handles real-time connections for:
- Display authentication
- Game joining/leaving
- Game start events

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB connection string
4. Set up proper CORS origins
5. Use HTTPS in production
6. Consider using a process manager like PM2

## Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT secret
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB authentication
- [ ] Implement proper logging
- [ ] Add request validation
- [ ] Set up monitoring and alerts 