const axios = require('axios');

// Test the printer service directly
async function testPrinterService() {
  console.log('🧪 Testing Printer Service...');
  
  try {
    // Test connection
    const response = await axios.post('http://localhost:6060/print', {
      jobId: 'test-connection',
      content: 'Connection test',
      type: 'custom'
    }, {
      timeout: 5000
    });
    
    console.log('✅ Printer Agent connection test:', response.status);
    
    // Test Bingo ticket printing
    const bingoResponse = await axios.post('http://localhost:6060/print', {
      jobId: `bingo-test-${Date.now()}`,
      type: 'bingo',
      bingoTicketData: {
        ticketNumber: '0000000000001',
        cashierFirstName: 'Test Cashier',
        cashierUsername: 'testuser',
        gameId: '4001',
        cartelaId: 123,
        stake: 10.00,
        cartelaNumbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
        dateTime: new Date().toISOString()
      }
    }, {
      timeout: 10000
    });
    
    console.log('✅ Bingo ticket print test:', bingoResponse.status);
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPrinterService();
