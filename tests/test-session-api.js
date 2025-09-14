const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

// Test session endpoints
async function testSessionAPI() {
  try {
    console.log('🧪 Testing Session API Endpoints...\n');

    // 1. Get cashier session data
    console.log('1. Testing GET /cashiers/:id/session');
    const cashierId = '688c98726b1ae86d79e4e3cb'; // alicebrown's ID
    
    const sessionResponse = await fetch(`${BASE_URL}/cashiers/${cashierId}/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN' // You'll need to get a real token
      }
    });

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session data retrieved:');
      console.log('Session ID:', sessionData.data.sessionId);
      console.log('Display URL:', sessionData.data.displayUrl);
      console.log('Is Connected:', sessionData.data.isConnected);
      console.log('Last Activity:', sessionData.data.lastActivity);
    } else {
      console.log('❌ Failed to get session data:', sessionResponse.status);
    }

    console.log('\n2. Testing connection status update');
    const connectionResponse = await fetch(`${BASE_URL}/cashiers/${cashierId}/connection`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
      },
      body: JSON.stringify({ isConnected: true })
    });

    if (connectionResponse.ok) {
      console.log('✅ Connection status updated');
    } else {
      console.log('❌ Failed to update connection status:', connectionResponse.status);
    }

    console.log('\n3. Testing session regeneration');
    const regenerateResponse = await fetch(`${BASE_URL}/cashiers/${cashierId}/regenerate-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
      }
    });

    if (regenerateResponse.ok) {
      const newSessionData = await regenerateResponse.json();
      console.log('✅ Session regenerated:');
      console.log('New Session ID:', newSessionData.data.sessionId);
      console.log('New Display URL:', newSessionData.data.displayUrl);
      console.log('New BAT Command:', newSessionData.data.batCommand);
    } else {
      console.log('❌ Failed to regenerate session:', regenerateResponse.status);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the test
testSessionAPI(); 