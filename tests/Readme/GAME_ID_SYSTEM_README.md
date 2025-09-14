# NEW 4-Digit Game ID System (4000-4999) 🎮

## **Overview**
The Game ID System has been completely redesigned to use **4-digit numbers from 4000 to 4999** with **daily reset to 4000** and **date & time stamps** for easy identification.

## **Key Features**

### **🎯 Game ID Format**
- **Range**: 4000 to 4999 (4 digits only)
- **Start Value**: 4000 (daily reset)
- **Maximum Value**: 4999
- **Wraparound**: When reaching 4999, resets to 4000

### **🕐 Daily Reset System**
- **Reset Time**: Midnight (00:00:00) every day
- **Reset Value**: Back to 4000
- **Per Cashier**: Each cashier has independent game ID tracking
- **Date Tracking**: Uses `lastGameDate` field for daily reset logic

### **📅 Date & Time Stamps**
- **Easy Identification**: Each game ID includes timestamp for tracking
- **Format**: `4000 (2024-01-15 14:30)` for display
- **Logging**: `4000_2024-01-15_14-30-25` for system logs
- **Real-time**: Timestamps are generated when games are created/ended

### **🔄 Game Flow**
1. **New Day**: Game ID resets to 4000
2. **Game Creation**: Gets next available ID (4000, 4001, 4002...)
3. **Game Completion**: ID increments for next game
4. **Daily Reset**: Back to 4000 at midnight

## **Database Schema**

### **Cashier Model**
```typescript
currentGameId: {
  type: Number,
  default: 4000,
  min: [4000, 'Game ID must be at least 4000'],
  max: [4999, 'Game ID cannot exceed 4999']
}
```

### **Game Model**
```typescript
gameId: {
  type: String,
  required: true,
  unique: true,
  validate: {
    validator: function(value: string) {
        const gameNumber = parseInt(value, 10);
      return !isNaN(gameNumber) && gameNumber >= 4000 && gameNumber <= 4999;
    }
  }
}
```

## **API Endpoints**

### **Game ID Management**
- `GET /api/cashier/game-id/current` - Get current game ID
- `GET /api/cashier/game-id/next` - Get next available game ID
- `POST /api/cashier/game-id/reset` - Manually reset to 4000
- `GET /api/cashier/game-id/info` - Get comprehensive game ID info

### **Game Operations**
- `POST /api/cashier/game/end` - End game and increment ID
- `POST /api/cashier/game/create` - Create new game with next ID

## **Socket Events**

### **Real-time Updates**
- `game_ended` - Emitted when game ends, includes new game ID
- `game_id_updated` - Emitted when game ID changes
- `game_data_refresh` - Emitted for data refresh after game end

## **Migration from 6-digit System**

### **Before Starting New System**
1. **Run Migration Script**:
   ```bash
   cd server
   npm run migrate:game-ids
   ```

2. **What Migration Does**:
   - Archives old 6-digit games to `CompletedGame` collection
   - Resets all cashier game IDs to 4000
   - Cleans invalid game IDs
   - Verifies database is ready for new system

### **Migration Safety**
- **No Data Loss**: Old games are archived, not deleted
- **Rollback Possible**: Can restore from `CompletedGame` if needed
- **Validation**: Script verifies database is clean before completion

## **Usage Examples**

### **Creating New Game**
```typescript
// Get next available game ID
const nextGameId = await GameIdService.getNextGameId(cashierId);
// Returns: 4000, 4001, 4002, etc.

// Create game with this ID
const game = new Game({
  gameId: nextGameId.toString(),
  // ... other fields
});
```

### **Ending Game**
```typescript
// End game and increment ID for next game
const nextGameId = await GameIdService.incrementGameIdForNextGame(cashierId);
// Returns: Next available ID (4001, 4002, etc.)
```

### **Daily Reset**
```typescript
// Check if new day
const isNewDay = await GameIdService.shouldResetGameId(cashier, today);
if (isNewDay) {
  // Game ID automatically resets to 4000
  console.log('New day - Game ID reset to 4000');
}
```

## **Error Handling**

### **Validation Errors**
- **Invalid Range**: Game IDs outside 4000-4999 are rejected
- **Duplicate IDs**: System prevents duplicate IDs within same day
- **Database Errors**: Graceful fallback with logging

### **Fallback Mechanisms**
- **ID Generation**: If primary method fails, fallback to increment
- **Cache Issues**: Database fallback if cache is corrupted
- **Network Issues**: Retry logic for database operations

## **Performance Features**

### **Caching**
- **5-minute TTL**: Reduces database calls
- **Per-cashier**: Individual cache per cashier
- **Auto-cleanup**: Expired cache entries are automatically removed

### **Database Optimization**
- **Indexes**: Optimized queries for game ID operations
- **Batch Operations**: Efficient bulk updates when possible
- **Connection Pooling**: Reuses database connections

## **Monitoring & Logging**

### **Console Logs**
```
🎮 Cashier john_doe: Next available Game ID is 4001
🎮 Cashier john_doe: Game completed, next Game ID will be 4002
🎮 Cashier john_doe: New day, Game ID reset to 4000
```

### **Error Logs**
```
❌ Error getting next available game ID: Cashier not found
⚠️ Invalid game ID 5000, resetting to 4000
```

## **Testing**

### **Unit Tests**
```bash
npm run test:game-id
```

### **Integration Tests**
```bash
npm run test:integration:game-id
```

### **Manual Testing**
1. Create new game → Should get ID 4000
2. End game → Should increment to 4001
3. Create another game → Should get ID 4001
4. Wait for midnight → Should reset to 4000

## **Troubleshooting**

### **Common Issues**
1. **Game ID not incrementing**: Check if `incrementGameIdForNextGame` is called
2. **Invalid game IDs**: Run migration script to clean database
3. **Cache issues**: Use `GameIdService.clearCache()` to reset cache
4. **Daily reset not working**: Check `lastGameDate` field in cashier document

### **Debug Commands**
```typescript
// Clear cache
GameIdService.clearCache();

// Get game ID info
const info = await GameIdService.getGameIdInfo(cashierId);

// Manual reset
await GameIdService.resetGameId(cashierId);
```

## **Future Enhancements**

### **Planned Features**
- **Time-based IDs**: Include time component in game ID
- **Branch Support**: Different ID ranges for different game types
- **Analytics**: Game ID usage statistics and reporting
- **Backup System**: Automated backup of game ID state

---

## **Summary**
The new 4-digit Game ID System provides:
- ✅ **Simple 4-digit IDs** (4000-4999)
- ✅ **Daily reset to 4000**
- ✅ **Date & time stamps** for easy identification
- ✅ **Real-time updates** via Socket.IO
- ✅ **Clean database** with migration support
- ✅ **Freedom to end games** from any status
- ✅ **Performance optimized** with caching
- ✅ **Error handling** with fallback mechanisms

**Ready for production use!** 🚀
