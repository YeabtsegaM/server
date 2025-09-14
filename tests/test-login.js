const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Testing cashier login...');
    
    const response = await axios.post('http://localhost:5000/api/cashier-auth/login', {
      username: 'alicebrown',
      password: 'password123'
    });
    
    console.log('✅ Login Response:');
    console.log('User ID:', response.data.data.user.id);
    console.log('Username:', response.data.data.user.username);
    console.log('Session ID:', response.data.data.user.sessionId);
    console.log('Display URL:', response.data.data.user.displayUrl);
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin(); 