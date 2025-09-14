# BINGO 2025

A real-time BINGO game management system with cashier and display applications.

## 🚀 Quick Start

### 1. Start the Server
```bash
cd server
npm install
npm run dev
```

### 2. Start Cashier Application
```bash
cd cashier
npm install
npm run dev
```
Open: http://localhost:3002

### 3. Start Display Application
```bash
cd display
npm install
npm run dev
```
Open: http://localhost:3001

## 📱 Applications

- **Server**: Backend API and Socket.IO server (Port 5000)
- **Cashier**: Game management interface (Port 3002)
- **Display**: Public game display (Port 3001)
- **Admin**: System administration (Port 3000)

## 🔧 Features

- Real-time game management
- Persistent sessions (no expiration)
- Admin-controlled session management
- Socket.IO for real-time updates
- MongoDB for data persistence

## 📋 Session Management

Sessions are **permanent** and only change when manually updated by an admin. This ensures:

- Cashier PC works without refreshing
- Display URL remains stable
- One-time setup for each location

## 🎯 Usage

1. **Admin** creates cashier accounts and assigns sessions
2. **Cashier** logs in and manages games
3. **Display** shows game progress in real-time
4. **Sessions** remain active until manually changed

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
BINGO2025/
├── server/          # Backend API & Socket.IO
├── cashier/         # Cashier management app
├── display/         # Public display app
└── admin/           # Admin dashboard
```

## 🔒 Security

- JWT authentication for cashiers
- Admin-only session management
- CORS configured for local development
- Rate limiting enabled

## 📞 Support

For session changes or system issues, contact your system administrator.
