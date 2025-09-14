/**
 * Simple Test: End Game Function
 * 
 * This script tests if the endGame function is working correctly
 * and updating the game ID as expected.
 */

const axios = require('axios');

// Test the end-game functionality
async function testEndGame() {
  try {
    console.log('🧪 Testing end-game functionality...');
    
    // Test data - use a real session ID from your database
    const testSessionId = 'dc16935d-9ef2-45ac-9c10-22bec6ecc01e'; // From your logs
    
    console.log('📋 Test session ID:', testSessionId);
    
    // Test the end-game endpoint
    console.log('\n1️⃣ Testing end-game endpoint...');
    const response = await axios.post('http://localhost:5000/api/verification/end-game', {
      sessionId: testSessionId
    });
    
    if (response.data.success) {
      console.log('✅ End-game successful!');
      console.log('📊 Response:', response.data);
    } else {
      console.log('❌ End-game failed:', response.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ HTTP Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testEndGame();
}

module.exports = { testEndGame };
