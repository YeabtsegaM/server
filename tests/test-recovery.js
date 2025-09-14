const axios = require('axios');

/**
 * Test script to call the recovery endpoint and fix corrupted games
 * Make sure your server is running first!
 */
async function testRecovery() {
  try {
    console.log('🚀 Testing corrupted games recovery...');
    console.log('📡 Calling recovery endpoint...');
    
    // Call the recovery endpoint
    const response = await axios.post('http://localhost:5000/api/admin/recover-corrupted-games', {}, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Replace with actual admin token
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Recovery successful!');
    console.log('📊 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Recovery failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 You need to provide a valid admin token in the script');
      console.log('🔑 Get your admin token from the admin login');
    }
  }
}

// Run the test
testRecovery();
