# Win Patterns Feature

## Overview
The Win Patterns feature allows cashiers to create, manage, and visualize custom bingo win patterns. Each cashier can have their own set of patterns that are used in bingo games.

## Features

### 1. Visual Pattern Editor
- Interactive 5x5 grid for creating custom patterns
- Click cells to toggle them on/off
- Visual feedback with green highlighting for selected cells
- Real-time preview of pattern

### 2. Preset Patterns
The system includes 10 common bingo patterns:
- Horizontal Line
- Vertical Line
- Diagonal (Top-Left to Bottom-Right)
- Diagonal (Top-Right to Bottom-Left)
- Cross Pattern
- Corner Pattern
- Full Card
- L Pattern
- T Pattern
- X Pattern

### 3. CRUD Operations
- **Create**: Add new patterns with custom names and layouts
- **Read**: View all patterns for the current cashier
- **Update**: Edit existing patterns (name, layout, active status)
- **Delete**: Remove patterns from the system

### 4. Real-time Updates
- Socket.IO integration for live updates
- Changes are reflected immediately across all connected clients
- Connection status indicator

### 5. Pattern Management
- Active/Inactive status toggle
- Pattern name validation (unique per cashier)
- Automatic pattern validation (5x5 grid requirement)

## Technical Implementation

### Frontend (Cashier App)
- **Location**: `cashier/src/components/modals/tabs/WinPatternTab.tsx`
- **Socket Hook**: `cashier/src/hooks/useWinPatternSocket.ts`
- **API Integration**: `cashier/src/utils/api.ts`

### Backend (Server)
- **Model**: `server/src/models/WinPattern.ts`
- **Controller**: `server/src/controllers/winPatternController.ts`
- **Routes**: `server/src/routes/winPatterns.ts`
- **Socket Handling**: Integrated in `server/src/index.ts`

### Database Schema
```typescript
interface WinPattern {
  id: string;
  name: string;
  pattern: boolean[][]; // 5x5 grid
  isActive: boolean;
  cashierId: string;
  shopId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET /api/win-patterns
Get all patterns for a cashier
- Query params: `cashierId`, `shopId` (optional)

### GET /api/win-patterns/active
Get active patterns for game use
- Query params: `cashierId`, `shopId` (optional)

### GET /api/win-patterns/:id
Get a specific pattern

### POST /api/win-patterns
Create a new pattern
- Body: `{ name, pattern, isActive, cashierId, shopId? }`

### PUT /api/win-patterns/:id
Update a pattern
- Body: `{ name?, pattern?, isActive? }`

### DELETE /api/win-patterns/:id
Delete a pattern

### PATCH /api/win-patterns/:id/status
Toggle pattern active status
- Body: `{ isActive }`

## Socket Events

### Client → Server
- `join_cashier_room`: Join cashier-specific room
- `leave_cashier_room`: Leave cashier-specific room

### Server → Client
- `win-pattern:created`: New pattern created
- `win-pattern:updated`: Pattern updated
- `win-pattern:deleted`: Pattern deleted
- `win-pattern:status-changed`: Pattern status changed

## Usage

### For Cashiers
1. Open Cashier Options modal
2. Click on "Win Pattern" tab
3. Use "Add Pattern" button to create new patterns
4. Click on pattern cards to edit or delete
5. Toggle active status to enable/disable patterns

### For Developers
1. Run the server: `npm run dev`
2. Seed sample patterns: `npm run seed:patterns`
3. Access the cashier interface and navigate to Win Pattern tab

## Security
- All endpoints require cashier authentication
- Patterns are scoped to individual cashiers
- Input validation for pattern structure
- Unique pattern names per cashier

## Future Enhancements
- Pattern templates for different game types
- Pattern sharing between cashiers
- Pattern usage analytics
- Advanced pattern validation rules
- Pattern import/export functionality 