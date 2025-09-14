const axios = require('axios');

async function testCashierAuth() {
  console.log('🔐 Testing Cashier Authentication...');
  
  try {
    // Test cashier login
    const loginResponse = await axios.post('http://localhost:5000/api/cashier-auth/login', {
      username: 'alicebrown',
      password: 'password123'
    });
    
    console.log('✅ Login successful:', {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.data?.token,
      userId: loginResponse.data.data?.user?.id
    });
    
    if (loginResponse.data.data?.token) {
      // Test token verification
      const verifyResponse = await axios.get('http://localhost:5000/api/cashier-auth/verify', {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.token}`
        }
      });
      
      console.log('✅ Token verification successful:', {
        success: verifyResponse.data.success,
        userId: verifyResponse.data.data?.user?.id
      });
      
      // Test socket connection with real token
      console.log('🔌 Testing socket connection with real token...');
      const io = require('socket.io-client');
      
      const cashierSocket = io('http://localhost:5000', {
        query: {
          type: 'cashier',
          cashierId: loginResponse.data.data.user.id,
          token: loginResponse.data.data.token,
          s: 'test-session'
        }
      });

      cashierSocket.on('connect', () => {
        console.log('✅ Socket connected with real token:', cashierSocket.id);
      });

      cashierSocket.on('cashier:unauthorized', () => {
        console.log('❌ Socket unauthorized with real token');
      });

      cashierSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      setTimeout(() => {
        cashierSocket.disconnect();
        console.log('📊 Cashier Auth Test Complete');
        process.exit(0);
      }, 3000);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCashierAuth().catch(console.error);
