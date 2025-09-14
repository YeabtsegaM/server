const io = require('socket.io-client');

async function testSocketConnection() {
  console.log('🔌 Testing Socket.IO Connection...');
  
  // Test cashier connection
  const cashierSocket = io('http://localhost:5000', {
    query: {
      type: 'cashier',
      cashierId: '688c98726b1ae86d79e4e3cb', // Use a real cashier ID
      token: 'test-token', // This will fail validation but we can see the flow
      s: 'test-session'
    }
  });

  cashierSocket.on('connect', () => {
    console.log('✅ Cashier connected:', cashierSocket.id);
  });

  cashierSocket.on('cashier:unauthorized', () => {
    console.log('❌ Cashier unauthorized (expected with test token)');
  });

  cashierSocket.on('disconnect', (reason) => {
    console.log('❌ Cashier disconnected:', reason);
  });

  cashierSocket.on('connect_error', (error) => {
    console.log('❌ Cashier connection error:', error.message);
  });

  // Wait for connection test
  setTimeout(() => {
    console.log('📊 Socket Connection Test Complete');
    cashierSocket.disconnect();
    process.exit(0);
  }, 3000);
}

testSocketConnection().catch(console.error);
