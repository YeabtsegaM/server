# Verification System Documentation

## Overview
The verification system allows cashiers to verify cartelas (bingo tickets) against the current game to determine if they are winners.

## How It Works

### 1. Verification Process
1. **Cashier enters Cartela ID** in the input field
2. **Clicks "Verify"** button
3. **System checks**:
   - Cartela exists in current game
   - Gets cartela's 5x5 pattern
   - Gets current game's called numbers
   - Gets active win patterns
   - Checks if cartela matches any win pattern
4. **Shows verification modal** with result

### 2. Verification Logic
- **Cartela Pattern**: 5x5 grid with numbers 1-75 (BINGO rules)
- **Center Cell**: Always 0 (free space)
- **Column Rules**:
  - B (1-15): First column
  - I (16-30): Second column  
  - N (31-45): Third column (except center)
  - G (46-60): Fourth column
  - O (61-75): Fifth column

### 3. Win Pattern Detection
The system checks for:
- **Horizontal Lines**: 5 numbers in a row
- **Vertical Lines**: 5 numbers in a column
- **Diagonal Lines**: 5 numbers diagonally
- **Custom Patterns**: Based on active win patterns in the game

## API Endpoints

### POST `/api/verification/verify-cartela`
Verify a cartela against the current game.

**Request Body:**
```json
{
  "cartelaId": 1,
  "sessionId": "session-uuid",
  "gameId": "4001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cartelaId": 1,
    "gameId": "4001",
    "status": "won|lost|verification",
    "cartelaGrid": [[6,30,37,55,61], [10,17,31,60,62], [11,29,0,52,64], [15,18,38,58,66], [1,27,32,57,75]],
    "matchedNumbers": [6,30,37,55,61],
    "winningPatternDetails": {
      "patternName": "Custom Pattern",
      "pattern": [[1,1,1,1,1], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
      "matchedPositions": [[0,0], [0,1], [0,2], [0,3], [0,4]]
    },
    "gameProgress": 12,
    "totalCalledNumbers": 12
  },
  "message": "Cartela verification completed"
}
```

### GET `/api/verification/history/:cartelaId/:cashierId`
Get verification history for a specific cartela.

**Response:**
```json
{
  "success": true,
  "data": [],
  "message": "Verification history retrieved"
}
```

## Database Collections Used

### 1. `cartelas` Collection
- **cartelaId**: Unique identifier (1-210)
- **pattern**: 5x5 grid array
- **isActive**: Boolean status
- **cashierId**: Associated cashier

### 2. `games` Collection  
- **gameId**: 4-digit game identifier (4000-4999)
- **sessionId**: Unique session identifier
- **gameData.calledNumbers**: Array of called numbers
- **gameData.winPatterns**: Array of active win patterns
- **gameData.progress**: Game progress (0-75)

### 3. `completedgames` Collection
- **finalCalledNumbers**: Final called numbers when game ended
- **finalWinPatterns**: Win patterns achieved
- **finalPlacedBetCartelas**: Cartelas that had bets

## Frontend Integration

### Verification Modal
The verification modal displays:
- **Cartela ID** and **Game ID**
- **5x5 BINGO Grid** with matched numbers highlighted
- **Win Pattern Details** (if winner)
- **Status**: Won/Lost/Verification
- **Game Progress** and **Called Numbers Count**

### Real-time Updates
- Modal opens when "Verify" is clicked
- Modal closes when "Verify/Close" is clicked again
- Results update in real-time as game progresses

## Testing

### Run Test Script
```bash
cd server
node test_verification.js
```

### Manual Testing
1. Start the server: `npm run dev`
2. Open cashier dashboard
3. Enter a cartela ID
4. Click "Verify"
5. Check console logs for verification details

## Error Handling

### Common Errors
- **Cartela not found**: Invalid cartela ID
- **Game not found**: Invalid session ID
- **Cartela inactive**: Cartela is not active
- **Server error**: Internal processing error

### Logging
The system provides detailed console logging:
- 🔍 Verification start
- 📋 Cartela found
- 🎮 Game data retrieved
- ✅ Matched numbers
- 📍 Matched positions
- 🎉 Winner detection
- 🔍 Verification complete

## Future Enhancements

### 1. Advanced Pattern Matching
- Support for custom win patterns from database
- Pattern validation against active game patterns
- Visual pattern overlay on cartela grid

### 2. Verification History
- Store verification results in database
- Track verification attempts and outcomes
- Provide verification analytics

### 3. Performance Optimization
- Cache frequently accessed cartela patterns
- Batch verification for multiple cartelas
- Background verification processing

## Security Considerations

### Access Control
- Only authenticated cashiers can verify cartelas
- Cartela access restricted to associated cashier
- Session validation for game access

### Data Validation
- Input sanitization for cartela IDs
- Pattern validation for cartela grids
- Game state validation before verification

## Troubleshooting

### Common Issues
1. **TypeScript compilation errors**: Check import statements and type definitions
2. **Database connection issues**: Verify MongoDB connection and collection names
3. **Pattern matching failures**: Ensure win patterns are properly formatted
4. **Real-time updates not working**: Check Socket.IO connection and event handling

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
DEBUG=verification npm run dev
```
