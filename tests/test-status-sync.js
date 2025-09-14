const io = require('socket.io-client');

// Test the game status synchronization between cashier and display
async function testStatusSync() {
  try {
    console.log('🧪 Testing game status synchronization...');
    
    // Test data
    const testCashierId = 'test-cashier-123';
    const testSessionId = 'test-session-456';
    const testToken = 'test-jwt-token';
    
    console.log('📋 Test cashier ID:', testCashierId);
    console.log('📋 Test session ID:', testSessionId);
    
    // Step 1: Connect cashier
    console.log('\n1️⃣ Connecting cashier...');
    const cashierSocket = io('http://localhost:5000', {
      query: {
        cashierId: testCashierId,
        token: testToken,
        type: 'cashier',
        s: testSessionId
      }
    });
    
    cashierSocket.on('connect', () => {
      console.log('✅ Cashier connected successfully');
    });
    
    cashierSocket.on('connect_error', (error) => {
      console.log('❌ Cashier connection error:', error.message);
    });
    
    // Step 2: Connect display
    console.log('\n2️⃣ Connecting display...');
    const displaySocket = io('http://localhost:5000', {
      query: {
        displayToken: testSessionId,
        s: testSessionId,
        type: 'display'
      }
    });
    
    displaySocket.on('connect', () => {
      console.log('✅ Display connected successfully');
    });
    
    displaySocket.on('connect_error', (error) => {
      console.log('❌ Display connection error:', error.message);
    });
    
    // Step 3: Wait for connections and test status sync
    setTimeout(async () => {
      console.log('\n3️⃣ Testing status synchronization...');
      
      if (cashierSocket.connected && displaySocket.connected) {
        console.log('✅ Both cashier and display are connected');
        
        // Test 1: Check initial status
        console.log('\n📊 Test 1: Checking initial status...');
        
        // Cashier should emit start_game
        cashierSocket.emit('start_game', {
          gameData: {
            cartelas: 5,
            totalStack: 1000,
            status: 'active'
          }
        });
        
        // Display should receive status update
        displaySocket.on('game_status_updated', (data) => {
          console.log('📺 Display received game_status_updated:', data);
          if (data.status === 'active') {
            console.log('✅ Display status synchronized: ACTIVE');
          } else {
            console.log('❌ Display status not synchronized:', data.status);
          }
        });
        
        displaySocket.on('game_data_updated', (data) => {
          console.log('📺 Display received game_data_updated:', data);
          if (data.status === 'active') {
            console.log('✅ Display data synchronized: ACTIVE');
          } else {
            console.log('❌ Display data not synchronized:', data.status);
          }
        });
        
        // Test 2: Check connection status
        console.log('\n📊 Test 2: Checking connection status...');
        
        cashierSocket.emit('get_display_status', { sessionId: testSessionId });
        
        cashierSocket.on('display:connection_status', (data) => {
          console.log('👤 Cashier received display connection status:', data);
          if (data.connected) {
            console.log('✅ Display connection status: Connected');
          } else {
            console.log('❌ Display connection status: Disconnected');
          }
        });
        
      } else {
        console.log('❌ One or both connections failed');
        if (!cashierSocket.connected) console.log('❌ Cashier not connected');
        if (!displaySocket.connected) console.log('❌ Display not connected');
      }
    }, 2000);
    
    // Step 4: Cleanup after 10 seconds
    setTimeout(() => {
      console.log('\n4️⃣ Cleaning up connections...');
      cashierSocket.disconnect();
      displaySocket.disconnect();
      console.log('✅ Connections closed');
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testStatusSync();
}

module.exports = { testStatusSync };
