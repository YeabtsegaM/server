const io = require('socket.io-client');
require('dotenv').config();

async function testConnection() {
  console.log('🔌 Testing Socket.IO Connection...');
  console.log('📋 Alice Session ID: e1d8db5b-41a9-468e-8da3-49b37ead67ff');
  
  // Test cashier connection
  const cashierSocket = io('http://localhost:5000', {
    query: {
      type: 'cashier',
      cashierId: 'alicebrown',
      s: 'e1d8db5b-41a9-468e-8da3-49b37ead67ff'
    }
  });

  cashierSocket.on('connect', () => {
    console.log('✅ Cashier connected:', cashierSocket.id);
  });

  cashierSocket.on('cashier:unauthorized', () => {
    console.log('❌ Cashier unauthorized');
  });

  cashierSocket.on('display:connection_status', (data) => {
    console.log('📺 Display connection status:', data);
  });

  // Test display connection
  const displaySocket = io('http://localhost:5000', {
    query: {
      type: 'display',
      s: 'e1d8db5b-41a9-468e-8da3-49b37ead67ff'
    }
  });

  displaySocket.on('connect', () => {
    console.log('✅ Display connected:', displaySocket.id);
  });

  displaySocket.on('cashier:connected', (data) => {
    console.log('🎯 Cashier connected to display:', data);
  });

  // Wait for connections
  setTimeout(() => {
    console.log('📊 Connection Test Complete');
    console.log('\n🎯 Next Steps:');
    console.log('1. Copy BAT command from admin interface');
    console.log('2. Run BAT file to open display');
    console.log('3. Open cashier app: http://localhost:3002');
    console.log('4. Login with alicebrown');
    console.log('5. Check connection status');
    cashierSocket.disconnect();
    displaySocket.disconnect();
    process.exit(0);
  }, 5000);
}

testConnection(); 