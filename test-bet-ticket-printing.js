const axios = require('axios');

// Test the actual bet ticket printing functionality with correct format
async function testBetTicketPrinting() {
  console.log('🧪 Testing Bet Ticket Printing...');
  
  try {
    // Test Bingo ticket printing (simulating what happens when bet is placed)
    console.log('🖨️ Sending Bingo ticket print request...');
    
    // Format the ticket content properly
    const cartelaNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
    const cartelaGrid = formatCartelaGrid(cartelaNumbers);
    const dateTime = new Date().toISOString().replace('T', ' ').replace('Z', ' (UTC)');
    
    const ticketContent = `0000000000001
Yeabtsega
yeab
${dateTime}
Bingo #4017 #1 #Stack : Br 5.00
${cartelaGrid}
0000000000001`;
    
    const bingoResponse = await axios.post('http://localhost:6060/print', {
      jobId: `bingo-bet-${Date.now()}`,
      type: 'ticket', // Use 'ticket' type
      content: ticketContent
    }, {
      timeout: 30000 // Increased timeout to 30 seconds
    });
    
    console.log('✅ Bet ticket print test:', bingoResponse.status);
    console.log('✅ Ticket should be printed with bet details!');
    
    // Wait a moment before testing multiple tickets
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test multiple tickets (simulating multiple cartelas selected)
    console.log('\n🧪 Testing Multiple Tickets...');
    
    const multipleTickets = [
      {
        ticketNumber: '0000000000002',
        cartelaId: 2,
        cartelaNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
      },
      {
        ticketNumber: '0000000000003',
        cartelaId: 3,
        cartelaNumbers: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]
      }
    ];
    
    for (let i = 0; i < multipleTickets.length; i++) {
      const ticket = multipleTickets[i];
      console.log(`🖨️ Printing ticket ${i + 1}: ${ticket.ticketNumber}`);
      
      const ticketContent = `000000000000${i}
Yeabtsega
yeab
${dateTime}
Bingo #4017 #${i} #Stack : Br 5.00
${formatCartelaGrid(ticket.cartelaNumbers)}
000000000000${i}`;
      
      const response = await axios.post('http://localhost:6060/print', {
        jobId: `bingo-multi-${Date.now()}-${i}`,
        type: 'ticket', // Use 'ticket' type
        content: ticketContent
      }, {
        timeout: 30000 // Increased timeout to 30 seconds
      });
      
      console.log(`✅ Ticket ${i + 1} printed successfully:`, response.status);
      
      // Longer delay between prints to avoid overwhelming the printer
      if (i < multipleTickets.length - 1) {
        console.log('⏳ Waiting 2 seconds before next print...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ All bet ticket printing tests completed successfully!');
    console.log('📋 Check your printer for the printed tickets');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timed out - printer may be busy or slow');
      console.error('💡 Try reducing the number of tickets or increasing timeout');
    }
  }
}

// Format cartela numbers into a 5x5 grid with asterisk for zero
function formatCartelaGrid(numbers) {
  if (!numbers || numbers.length !== 25) {
    // If no numbers provided, use default cartela numbers
    const defaultNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
    return formatGrid(defaultNumbers);
  }
  
  return formatGrid(numbers);
}

// Format numbers into a 5x5 grid
function formatGrid(numbers) {
  let grid = '';
  for (let i = 0; i < 5; i++) {
    const row = numbers.slice(i * 5, (i + 1) * 5);
    grid += row.map(num => num === 0 ? '*' : num.toString().padStart(2, '0')).join(' ') + '\n';
  }
  return grid;
}

// Run the test
testBetTicketPrinting();
